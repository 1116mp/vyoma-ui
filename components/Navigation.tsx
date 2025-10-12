"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/ResizeAbleNavbar";
import { useState,useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { Star } from "lucide-react";

async function getGitHubStars(): Promise<number> {
  try {
    // Make the API call
    const response = await fetch("https://api.github.com/repos/Srijan-Baniyal/vyoma-ui", {
      headers: {
        Accept: "application/vnd.github+json",
      },
      next: {
        revalidate: 3600, // Update every hour (3600 seconds)
      },
    });

    // If something goes wrong, throw an error
    if (!response.ok) {
      throw new Error("Failed to fetch GitHub stars");
    }

    // Parse the JSON response
    const data = await response.json();
    
    // Return just the star count
    return data.stargazers_count;
  } catch (error) {
    // If anything fails, log it and return 0
    console.error("Error fetching GitHub stars:", error);
    return 0;
  }
}

export default function Navigation() {
  const navItems = [
    {
      name: "Components",
      link: "/components/accordion",
    },
    {
      name: "Showcase",
      link: "/showcase",
    },
    {
      name: "Theme(Beta)",
      link: "/themes",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stars, setStars] = useState<number | null>(null);
  const formatStarCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`; // 1500 → "1.5k"
    }
    return count.toString(); // 500 → "500"
  };

  useEffect(() => {
    getGitHubStars().then(setStars).catch(console.error);
  }, []);

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
  href="https://github.com/Srijan-Baniyal/vyoma-ui"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
>
  <Star className="w-4 h-4 mr-2 fill-current" />
  {stars !== null ? (
    <>
      <span className="font-semibold">{formatStarCount(stars)}</span>
      <span className="ml-1">stars</span>
    </>
  ) : (
    "Star on GitHub"
  )}
</Link>
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="relative text-neutral-600 dark:text-neutral-300 hover:text-foreground transition-colors"
              target={item.link.startsWith("http") ? "_blank" : undefined}
              rel={
                item.link.startsWith("http") ? "noopener noreferrer" : undefined
              }
            >
              <span className="block">{item.name}</span>
            </Link>
          ))}
          <div className="flex w-full flex-col gap-4 mt-6">
          <Link
              href="https://github.com/Srijan-Baniyal/vyoma-ui"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full"
            >
              <Star className="w-4 h-4 mr-2 fill-current" />
              {stars !== null ? (
                <>
                  <span className="font-semibold">{formatStarCount(stars)}</span>
                  <span className="ml-1">stars</span>
                </>
              ) : (
                "Star on GitHub"
              )}
            </Link>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
