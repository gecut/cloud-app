import test from "node:test";
import assert from "node:assert/strict";
import {
  PaymentAmountMismatchError,
  PaymentGatewayError,
  PaymentInvalidCallbackError,
  PaymentRequestError,
  PaymentVerificationError,
  ZibalClient,
} from "./index";

test("ZibalClient - getPaymentUrl", () => {
  const client = new ZibalClient({ merchant: "zibal", baseUrl: "https://gateway.zibal.ir" });
  assert.equal(client.getPaymentUrl(123456), "https://gateway.zibal.ir/start/123456");
  assert.equal(client.getPaymentUrl("987654"), "https://gateway.zibal.ir/start/987654");

  assert.throws(() => client.getPaymentUrl(""), PaymentGatewayError);
});

test("ZibalClient - parseCallback", () => {
  const client = new ZibalClient();

  // Valid success callback
  const parsedSuccess = client.parseCallback({
    trackId: "12345678",
    success: "1",
    status: "2",
    orderId: "inv_123",
  });
  assert.equal(parsedSuccess.trackId, 12345678);
  assert.equal(parsedSuccess.isSuccess, true);
  assert.equal(parsedSuccess.status, 2);
  assert.equal(parsedSuccess.orderId, "inv_123");

  // Valid failure / cancelled callback
  const parsedFailure = client.parseCallback({
    trackId: "12345678",
    success: "0",
    status: "3",
  });
  assert.equal(parsedFailure.trackId, 12345678);
  assert.equal(parsedFailure.isSuccess, false);
  assert.equal(parsedFailure.status, 3);
  assert.equal(parsedFailure.statusTextFa, "لغو شده توسط کاربر");

  // Missing trackId
  assert.throws(
    () => client.parseCallback({ success: "1" }),
    PaymentInvalidCallbackError,
  );

  // Invalid trackId
  assert.throws(
    () => client.parseCallback({ trackId: "invalid_id" }),
    PaymentInvalidCallbackError,
  );
});

test("ZibalClient - requestPayment success and error with mocked fetch", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const client = new ZibalClient({ merchant: "zibal_test" });

    // Mock successful response
    globalThis.fetch = (async (url: any, options: any) => {
      assert.match(String(url), /\/v1\/request/);
      const body = JSON.parse(String((options as any)?.body));
      assert.equal(body.merchant, "zibal_test");
      assert.equal(body.amount, 500000);
      assert.equal(body.callbackUrl, "https://mywebsite.com/callback");

      return new Response(
        JSON.stringify({
          trackId: 10203040,
          result: 100,
          message: "success",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const res = await client.requestPayment({
      amountRials: 500000,
      callbackUrl: "https://mywebsite.com/callback",
      description: "Test invoice",
      orderId: "INV-001",
    });

    assert.equal(res.trackId, 10203040);
    assert.equal(res.result, 100);
    assert.equal(res.paymentUrl, "https://gateway.zibal.ir/start/10203040");

    // Mock failed response (e.g. invalid merchant)
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          result: 104,
          message: "merchant is not valid",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    await assert.rejects(
      () =>
        client.requestPayment({
          amountRials: 10000,
          callbackUrl: "https://mywebsite.com/callback",
        }),
      (err: any) => {
        assert.ok(err instanceof PaymentRequestError);
        assert.equal(err.code, 104);
        assert.equal(err.userMessage, "مرچنت نامعتبر است");
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ZibalClient - verifyPayment newly verified and already verified", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const client = new ZibalClient({ merchant: "zibal" });

    // 1. Newly verified (result: 100)
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          paidAt: "2026-09-24T12:00:00.000000",
          amount: 25000000, // 25,000,000 Rials = 2,500,000 Toman
          result: 100,
          status: 1,
          refNumber: 998877,
          description: "Payment for order",
          cardNumber: "603799****1234",
          orderId: "inv_abc",
          message: "success",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const verifyResult = await client.verifyPayment({ trackId: 10203040 });
    assert.equal(verifyResult.isNewlyVerified, true);
    assert.equal(verifyResult.isAlreadyVerified, false);
    assert.equal(verifyResult.amountRials, 25000000);
    assert.equal(verifyResult.amountToman, 2500000);
    assert.equal(verifyResult.refNumber, 998877);

    // 2. Already verified (result: 201)
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          paidAt: "2026-09-24T12:00:00.000000",
          amount: 25000000,
          result: 201,
          status: 1,
          refNumber: 998877,
          message: "already verified",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const alreadyVerifiedResult = await client.verifyPayment({ trackId: 10203040 });
    assert.equal(alreadyVerifiedResult.isNewlyVerified, false);
    assert.equal(alreadyVerifiedResult.isAlreadyVerified, true);
    assert.equal(alreadyVerifiedResult.amountToman, 2500000);

    // 3. Failed verification (result: 202)
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          result: 202,
          message: "order not paid or failed",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    await assert.rejects(
      () => client.verifyPayment({ trackId: 10203040 }),
      PaymentVerificationError,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("PaymentAmountMismatchError checks", () => {
  const err = new PaymentAmountMismatchError(50000, 40000);
  assert.equal(err.expectedAmountToman, 50000);
  assert.equal(err.actualAmountToman, 40000);
  assert.equal(err.code, "AMOUNT_MISMATCH");
  assert.match(err.userMessage, /همخوانی ندارد/);
});
