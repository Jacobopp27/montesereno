import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface GalleryImage {
  id: number;
  imageUrl: string;
  title?: string;
  description?: string;
}

export default function GallerySection() {
  const { data: galleryImages = [] } = useQuery({
    queryKey: ["/api/gallery"],
    retry: false,
  });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const images = (galleryImages as GalleryImage[]) || [];

  const slides = images.map((image) => ({
    src: image.imageUrl,
    alt: image.title || image.description || "Imagen de galería",
  }));

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <section id="gallery" className="py-12 bg-light-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-bold text-4xl text-navy mb-4">
            Galería
          </h2>
          <p className="text-xl text-charcoal">
            Mira lo que te espera en Montesereno Glamping
          </p>
        </div>
        
        {images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-charcoal text-lg">
              Próximamente se agregarán imágenes de nuestra hermosa cabaña de montaña.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <img
                key={image.id || index}
                src={image.imageUrl}
                alt={image.title || image.description || "Imagen de galería"}
                loading="lazy"
                className="rounded-lg shadow-md w-full h-48 object-cover hover:transform hover:scale-105 transition-transform cursor-pointer antialiased"
                onClick={() => handleImageClick(index)}
              />
            ))}
          </div>
        )}

        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={slides}
          carousel={{ finite: true }}
          render={{
            buttonPrev: slides.length <= 1 ? () => null : undefined,
            buttonNext: slides.length <= 1 ? () => null : undefined,
          }}
        />
      </div>
    </section>
  );
}
