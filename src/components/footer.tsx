export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PolitiRate. All rights reserved.</p>
        <p className="text-sm mt-1">A platform for civic engagement.</p>
      </div>
    </footer>
  );
}
