"use client";

import useEmblaCarousel from "embla-carousel-react";

export function ServicesSlider() {
  const slides = ["/banner.jpg", "/banner.jpg"];

  const [emblaRef] = useEmblaCarousel({
    loop: true,
    align: "start",
  });

  return (
    <div className="w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((src, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0">
              <img
                src={src}
                className="w-full h-45 rounded-3xl object-cover"
                alt={`slide-${index}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
