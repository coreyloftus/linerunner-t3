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
      "inline-flex h-12 iphone:h-14 items-center justify-center rounded-xl border border-border bg-surface-raised/80 p-1 text-muted-foreground shadow-sm backdrop-blur-sm [touch-action:manipulation]",
      // Mobile spacing and overflow handling
      "w-full max-w-md gap-1",
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
      "min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-200 [touch-action:manipulation]",
      // Mobile typography - smaller on mobile, larger on desktop
      "text-mobile-xs iphone:text-mobile-sm md:text-sm font-medium",
      // Mobile padding - more generous touch area
      "px-1 py-2 iphone:px-2 md:px-3",
      // Hover state for inactive tabs
      "hover:text-foreground",
      // Active state styling — spotlight amber
      "data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow data-[state=active]:font-semibold",
      // Focus and accessibility
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
