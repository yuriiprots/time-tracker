import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutocompleteProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  suggestions: string[];
  onValueChange: (value: string) => void;
}

const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(
  ({ className, suggestions, onValueChange, value, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = React.useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    // Filter suggestions based on input
    React.useEffect(() => {
      if (typeof value === "string") {
        if (value.length === 0) {
          // Show all suggestions when empty (will be controlled by isOpen state)
          setFilteredSuggestions(suggestions);
        } else {
          // Filter and exclude exact matches
          const filtered = suggestions.filter((suggestion) =>
            suggestion.toLowerCase().includes(value.toLowerCase()) &&
            suggestion.toLowerCase() !== value.toLowerCase()
          );
          setFilteredSuggestions(filtered);
        }
      } else {
        setFilteredSuggestions([]);
      }
      setHighlightedIndex(-1);
    }, [value, suggestions]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0) {
            onValueChange(filteredSuggestions[highlightedIndex]);
            setIsOpen(false);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    };

    const handleSelect = (suggestion: string) => {
      onValueChange(suggestion);
      setIsOpen(false);
    };

    const handleFocus = () => {
      if (filteredSuggestions.length > 0) {
        setIsOpen(true);
      }
    };

    return (
      <div ref={wrapperRef} className="relative w-full">
        <input
          type="text"
          className={cn(
            "flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          ref={ref}
          {...props}
        />

        {isOpen && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer transition-colors",
                  highlightedIndex === index && "bg-primary-50 text-primary-700"
                )}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Autocomplete.displayName = "Autocomplete";

export { Autocomplete };
