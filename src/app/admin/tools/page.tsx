
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Bell, Vote, Video, FileText, Mail } from "lucide-react";
import Link from "next/link";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  disabled?: boolean;
}

const ToolCard = ({ title, description, icon: Icon, href, disabled }: ToolCardProps) => (
  <Card className="flex flex-col">
    <CardHeader>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex-grow flex items-end">
      <Button asChild disabled={disabled} className="w-full">
        <Link href={href}>Manage</Link>
      </Button>
    </CardContent>
  </Card>
);

export default function AdminToolsPage() {
  const tools = [
    {
      title: "Site Maintenance",
      description: "Enable or disable site maintenance mode.",
      icon: Wrench,
      href: "#",
      disabled: true,
    },
    {
      title: "Display Notifications",
      description: "Create and manage site-wide notifications.",
      icon: Bell,
      href: "#",
      disabled: true,
    },
    {
      title: "Add Polls",
      description: "Create and manage public polls.",
      icon: Vote,
      href: "#",
      disabled: true,
    },
    {
      title: "Add Videos",
      description: "Upload and manage promotional videos.",
      icon: Video,
      href: "#",
      disabled: true,
    },
    {
      title: "Manage Contents",
      description: "Edit static content on the website.",
      icon: FileText,
      href: "#",
      disabled: true,
    },
    {
      title: "Site Contacts",
      description: "View and manage contact form submissions.",
      icon: Mail,
      href: "#",
      disabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Admin Tools</h1>
      <p className="text-muted-foreground">
        Access various administrative tools to manage the site. These features are currently under development.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <ToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </div>
  );
}
