"use client";

import Link from "next/link";
import * as React from "react";
import {
  IconCamera,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconNotes,
  IconPencilMinus,
  IconNotebook,
  IconHash,
} from "@tabler/icons-react";

import { NavTags } from "@/components/nav-tags";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Calendar } from "@/components/ui/calendar";

const data = {
  navMain: [
    {
      title: "Journal",
      url: "/journal",
      icon: IconNotebook,
    },
    {
      title: "Notes",
      url: "#",
      icon: IconNotes,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ],
  tags: [
    {
      name: "Data Library",
      url: "#",
      icon: IconHash,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconHash,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconHash,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconPencilMinus className="!size-5" />
                <span className="text-base font-semibold">EchoJot</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="flex justify-center p-2"
        />
        <NavMain items={data.navMain} />

        <NavTags items={data.tags} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarFooter>
    </Sidebar>
  );
}
