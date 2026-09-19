import { Link } from "@tanstack/react-router";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/tanstack-react-start";
import {
    Activity,
    BookOpen,
    LayoutDashboard,
    Lightbulb,
    Palette,
    Search,
    Users,
} from "lucide-react";
import { useApp } from "@/src/providers/app-provider";

const learnerNav = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dictionary", label: "Dictionary", icon: Search },
    { to: "/flashcards", label: "Flashcards", icon: BookOpen },
];

const adminNav = [
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/suggestions", label: "Suggestions", icon: Lightbulb },
    { to: "/admin/analytics", label: "Traffic analytics", icon: Activity },
    { to: "/admin/customize", label: "Customize web", icon: Palette },
];

const NavList: React.FC = () => {
    const user = useApp((state) => state.user);

    const items = user?.role === "admin" ? adminNav : learnerNav;

    return (
        <div className="flex flex-row gap-2 items-center">
            {items.map((item) => {
                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        activeProps={{ className: "bg-primary text-primary-foreground shadow-sm" }}
                        inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
                        className="flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition"
                    >
                        {item.label}
                    </Link>
                )
            })}
            <Show when="signed-in">
                <Link

                    to="/me"
                    activeProps={{ className: "bg-primary text-primary-foreground shadow-sm" }}
                    inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
                    className="flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition"
                >
                    Your Profile
                </Link>
            </Show>
            {/* <Show when="signed-in">
                <span className="ml-2">
                    <UserButton />
                </span>
            </Show> */}
            <Show when="signed-out">
                <SignInButton />
                <SignUpButton />
            </Show>
        </div>
    );
}

export default NavList;