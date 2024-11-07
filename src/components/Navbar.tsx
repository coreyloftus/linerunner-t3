"use client";
import * as React from "react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";

export const Navbar = () => {
  return (
    <div className="">
      <NavigationMenu className="text-[#010101]">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <p className="flex-1">Item One</p>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="lg grid w-[500px] gap-3 p-6 md:w-[400px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink>
                    <p className="text-blue-400">Link One</p>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item Two</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="lg grid w-[500px] gap-3 p-6 md:w-[400px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink>
                    <p className="text-blue-400">Two link</p>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item Three</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="lg grid w-[500px] gap-3 p-6 md:w-[400px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink>
                    <p className="text-blue-400">Link trois</p>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};
