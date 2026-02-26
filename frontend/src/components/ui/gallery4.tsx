"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export interface Gallery4Item {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
}

export interface Gallery4Props {
  title?: string;
  description?: string;
  items: Gallery4Item[];
}

const Gallery4 = ({ title = "Best-sellers", description, items }: Gallery4Props) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    carouselApi.on("reInit", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
      carouselApi.off("reInit", updateSelection);
    };
  }, [carouselApi]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-2 md:py-4">
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-medium leading-[0.9] text-[#4e3024] md:text-5xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-lg text-xs uppercase tracking-[0.08em] text-[#6a4d3f]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="hidden shrink-0 gap-2 md:flex">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => carouselApi?.scrollPrev()}
            disabled={!canScrollPrev}
            className="h-9 w-9 rounded-full border border-[#6a4d3f1f] text-[#4e3024] disabled:pointer-events-auto"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => carouselApi?.scrollNext()}
            disabled={!canScrollNext}
            className="h-9 w-9 rounded-full border border-[#6a4d3f1f] text-[#4e3024] disabled:pointer-events-auto"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Carousel
        setApi={setCarouselApi}
        opts={{
          align: "center",
          containScroll: "trimSnaps",
          breakpoints: {
            "(max-width: 768px)": {
              dragFree: true,
            },
          },
        }}
      >
        <CarouselContent className="ml-0">
          {items.map((item) => (
            <CarouselItem
              key={item.id}
              className="basis-[84%] pl-3 sm:basis-[50%] lg:basis-[33.333%] xl:basis-[24%]"
            >
              <Link
                to={item.href}
                className="group relative block min-h-[24rem] overflow-hidden shadow-[0_10px_28px_rgba(41,27,20,0.16)]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#20130d]/85 via-[#20130d]/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 p-5 text-center text-[#fbf6ed] md:p-6">
                  <h3 className="m-0 text-[30px] leading-[0.9]">{item.title}</h3>
                  <p className="m-0 text-xs uppercase tracking-[0.08em]">{item.description}</p>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="mt-5 flex justify-center gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`h-[2px] w-9 transition-colors ${
              currentSlide === index ? "bg-[#4e3024]" : "bg-[#4e302436]"
            }`}
            onClick={() => carouselApi?.scrollTo(index)}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export { Gallery4 };
