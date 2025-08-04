"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "~/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Mobile-first design with touch targets
      "inline-flex h-12 iphone:h-14 items-center justify-center rounded-lg bg-stone-100 p-1 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
      // Mobile spacing and overflow handling
      "w-full max-w-md gap-mobile mobile-tap",
      // Responsive grid for equal width tabs
      "grid grid-cols-4",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Mobile-first touch targets and responsive design
      "touch-target flex flex-col items-center justify-center gap-1 rounded-md transition-all mobile-tap",
      // Mobile typography - smaller on mobile, larger on desktop
      "text-mobile-xs iphone:text-mobile-sm md:text-sm font-medium",
      // Mobile padding - more generous touch area
      "px-1 py-2 iphone:px-2 md:px-3",
      // Active state styling
      "data-[state=active]:bg-newStyle-accent-color dark:data-[state=active]:bg-newStyle-accent-color",
      "data-[state=active]:text-stone-950 data-[state=active]:shadow",
      // Focus and accessibility
      "ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2",
      "dark:ring-offset-stone-950 dark:focus-visible:ring-stone-300 dark:data-[state=active]:text-stone-950",
      // Disabled state
      "disabled:pointer-events-none disabled:opacity-50",
      // Responsive behavior
      "whitespace-nowrap overflow-hidden text-ellipsis",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 dark:ring-offset-stone-950 dark:focus-visible:ring-stone-300",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
