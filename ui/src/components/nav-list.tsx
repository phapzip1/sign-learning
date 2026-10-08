import React from "react";
import { Link } from "@tanstack/react-router";
import { Show, SignInButton, SignOutButton } from "@clerk/tanstack-react-start";
import {
    Activity,
    BookOpen,
    Hand,
    Home,
    Lightbulb,
    LogIn,
    LogOut,
    Menu,
    Palette,
    Search,
    UserRound,
    Users,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
};

const basicNav: NavItem[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/dictionary", label: "Dictionary", icon: Search },
];

const authedNav: NavItem[] = [
    { to: "/flashcards", label: "Study", icon: BookOpen },
    { to: "/me", label: "Your Profile", icon: UserRound },
];

const adminNav: NavItem[] = [
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/suggestions", label: "Suggestions", icon: Lightbulb },
    { to: "/admin/analytics", label: "Traffic analytics", icon: Activity },
    { to: "/admin/customize", label: "Customize web", icon: Palette },
];

const NavLink: React.FC<{
    item: NavItem;
    onNavigate?: () => void;
    className?: string;
}> = ({ item, onNavigate, className }) => {
    const Icon = item.icon;

    return (
        <Link
            to={item.to}
            onClick={onNavigate}
            activeOptions={{ exact: item.to === "/" }}
            activeProps={{ className: "bg-secondary text-primary" }}
            inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
            className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors", className)}
        >
            <Icon className="size-4" />
            {item.label}
        </Link>
    );
}

const NavLinks: React.FC<{
    onNavigate?: () => void;
    itemClassName?: string;
}> = ({ onNavigate, itemClassName }) => {
    return (
        <>
            {
                basicNav.map((item) => (
                    <NavLink key={item.to} item={item} onNavigate={onNavigate} className={itemClassName} />
                ))
            }
            <Show when="signed-in">
                {
                    authedNav.map((item) => (
                        <NavLink key={item.to} item={item} onNavigate={onNavigate} className={itemClassName} />
                    ))
                }
            </Show>
        </>
    );
}

const AuthButton: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <>
            <Show when="signed-in">
                <SignOutButton>
                    <Button variant="ghost" className={cn("text-muted-foreground", className)}>
                        <LogOut />
                        Logout
                    </Button>
                </SignOutButton>
            </Show>
            <Show when="signed-out">
                <SignInButton>
                    <Button className={className}>
                        <LogIn />
                        Login
                    </Button>
                </SignInButton>
            </Show>
        </>
    );
}

const NavList: React.FC = () => {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            {/* Desktop */}
            <nav className="hidden items-center gap-1 md:flex">
                <NavLinks />
                <span className="mx-2 h-6 w-px bg-border" />
                <AuthButton />
            </nav>

            {/* Mobile */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger
                    render={
                        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                            <Menu className="size-5" />
                        </Button>
                    }
                />
                <SheetContent side="right" className="gap-2 p-4">
                    <SheetHeader className="p-0 pb-4">
                        <SheetTitle className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <Hand className="size-4" />
                            </span>
                            Sign Learning
                        </SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-1">
                        <NavLinks onNavigate={() => setOpen(false)} itemClassName="py-3 text-base" />
                    </nav>
                    <div className="mt-auto border-t pt-4">
                        <AuthButton className="w-full" />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

export default NavList;
