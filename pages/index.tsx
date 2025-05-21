import Head from "next/head";
import Image from "next/image";
import { fetchPosterUrl } from "../utils/fetchPosterUrl";
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(
    null
  );
  const [movieData, setMovieData] = useState<Record<string, any>>({});

  // --- Scroll behavior logic for movie scroll section ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft >= 64);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
    }
  };

  const scrollByOffset = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  const formatTitle = (name: string) =>
    name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  useEffect(() => {
    fetch("/api/movies")
      .then((res) => res.json())
      .then(async (movieList) => {
        const movies: Record<string, any> = {};

        for (const { name, data } of movieList) {
          const readableName = name.replace(/_/g, " ");
          const res = await fetch(
            `/api/poster?name=${encodeURIComponent(readableName)}`
          );
          const { posterUrl } = await res.json();
          movies[name] = {
            ...data,
            posterUrl: posterUrl || "/fallback.jpg",
          };
        }

        setMovieData(movies);

        requestAnimationFrame(() => {
          handleScroll();
        });
      });
  }, []);

  const frameworks = ["Hero’s Journey", "Save the Cat", "Story Circle"];
  const [showFrameworkSummary, setShowFrameworkSummary] = useState(false);

  // --- Active section state for breakdown highlighting ---
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // IntersectionObserver for breakdown highlighting
  useEffect(() => {
    if (!selectedMovie || !selectedFramework) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible?.target) {
          setActiveSection(visible.target.getAttribute("data-key"));
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.6 }
    );

    const elements = document.querySelectorAll(".timeline-entry");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [selectedMovie, selectedFramework]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">
      <Head>
        <title>Denis</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="text-center py-8 flex flex-col items-center space-y-2">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Denis logo" width={48} height={48} />
          <h1 className="text-4xl font-bold">Denis</h1>
        </div>
        <p className="text-lg text-gray-600 text-center max-w-md">
          Movie structure, frame by frame.
        </p>
      </header>

      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const isInteractive =
            target.closest("button") ||
            target.closest(".toggle-switch") ||
            target.closest(".movie-poster") ||
            target.closest(".framework-toggle");
          if (!isInteractive && target.id === "background-capture") {
            setSelectedMovie(null);
            setSelectedFramework(null);
          }
        }}
        id="background-capture"
      >
        <main className="flex-grow max-w-4xl mx-auto px-4 space-y-12 pb-12">
          {/* Step 1: Pick a Movie */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <span className="inline-block px-2.5 py-1 text-sm font-bold bg-blue-100 text-blue-800 rounded-full">
                1
              </span>
              <h2 className="text-lg font-semibold">Pick a Movie</h2>
            </div>
            <div className="relative">
              {canScrollLeft && (
                <button
                  onClick={() => scrollByOffset(-200)}
                  className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center z-10 hover:bg-gray-200"
                >
                  <span className="text-gray-600 text-lg pointer-events-none">
                    &larr;
                  </span>
                </button>
              )}

              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex space-x-4 overflow-x-auto scroll-snap-x snap-x snap-mandatory px-1"
              >
                {Object.keys(movieData).map((movie) => {
                  const filename = movieData[movie].posterUrl;
                  return (
                    <div
                      key={movie}
                      onClick={() => setSelectedMovie(movie)}
                      className={`movie-poster w-32 h-48 rounded-md overflow-hidden flex-shrink-0 cursor-pointer border-2 transition relative snap-start transform transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-md ${
                        selectedMovie === movie
                          ? "border-4 border-blue-600 scale-105 shadow-md"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        src={filename}
                        alt={formatTitle(movie)}
                        width={128}
                        height={192}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute bottom-0 w-full text-center text-xs bg-black bg-opacity-50 text-white py-1">
                        {formatTitle(movie)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {canScrollRight && (
                <button
                  onClick={() => scrollByOffset(200)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center z-10 hover:bg-gray-200"
                >
                  <span className="text-gray-600 text-lg pointer-events-none">
                    &rarr;
                  </span>
                </button>
              )}
            </div>
          </section>

          {/* Step 2: Pick a Framework */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div className="text-lg font-semibold flex items-center space-x-2">
                <span className="inline-block px-2.5 py-1 text-sm font-bold bg-blue-100 text-blue-800 rounded-full">
                  2
                </span>
                <h2 className="">Pick a Framework</h2>
              </div>

              <div className="framework-toggle w-full sm:w-auto flex items-center gap-2">
                <span className="text-sm text-gray-800">
                  {showFrameworkSummary
                    ? "Hide framework explanation"
                    : "Show framework explanation"}
                </span>
                <div
                  onClick={() => setShowFrameworkSummary(!showFrameworkSummary)}
                  className={`relative w-11 h-6 rounded-full flex items-center px-0.5 border transition duration-300 cursor-pointer shadow-sm hover:ring-2 hover:ring-blue-300 ${
                    showFrameworkSummary
                      ? "bg-blue-400 border-blue-500"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full transition-transform duration-300 ${
                      showFrameworkSummary
                        ? "translate-x-5 bg-white"
                        : "bg-gray-400"
                    }`}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {frameworks.map((fw) => (
                <div key={fw} className="relative">
                  <button
                    onClick={() => setSelectedFramework(fw)}
                    className={`relative group px-4 py-2 rounded border cursor-pointer transition w-48 text-left ${
                      selectedFramework === fw
                        ? "bg-blue-100 border-blue-500"
                        : "bg-white border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-semibold">{fw}</div>
                    {showFrameworkSummary && (
                      <p className="mt-2 text-xs text-gray-700">
                        {fw === "Hero’s Journey"
                          ? "The Hero’s Journey is a 12-stage narrative structure identified by Joseph Campbell. It includes steps such as the Call to Adventure, Meeting the Mentor, and Return with the Elixir. It’s used in stories like Star Wars and The Lord of the Rings."
                          : fw === "Save the Cat"
                          ? "Save the Cat is a 15-beat screenwriting formula developed by Blake Snyder. It emphasizes clear emotional turning points like the Catalyst, Midpoint, and Finale. Common in Hollywood films."
                          : "The Story Circle, popularized by Dan Harmon, breaks story into 8 beats based on character transformation. It’s widely used in modern television and emphasizes internal change through cyclical storytelling."}
                      </p>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Breakdown Display */}
          {selectedMovie && selectedFramework && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-4">
                {formatTitle(selectedMovie)} — {selectedFramework}
              </h2>
              <div className="space-y-4">
                {Object.entries(
                  movieData[selectedMovie].frameworks[selectedFramework] || {}
                ).map(([section, text]: [string, unknown]) => (
                  <div
                    key={section}
                    className="p-5 bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-400 rounded-lg shadow text-sm text-gray-800 space-y-2"
                  >
                    <h3 className="font-semibold">{section}</h3>
                    <p>{String(text)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
      <footer className="mt-16 text-center text-xs text-gray-500 pb-6 px-4">
        <div className="flex items-center justify-center space-x-2">
          <Image src="/tmdb.svg" alt="TMDB logo" width={24} height={24} />
          <span>
            This website uses TMDB and the TMDB APIs but is not endorsed,
            certified, or otherwise approved by TMDB.
          </span>
        </div>
      </footer>
    </div>
  );
}
