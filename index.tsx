import definePlugin, { IconComponent } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Toasts } from "@webpack/common";
import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";

const CommandIndexStore = findByPropsLazy("Zn", "ON", "XC", "Ay");
const ChannelStore      = findByPropsLazy("getChannel", "getDMFromUserId");
const GuildStore        = findByPropsLazy("getGuild", "getGuildCount");

async function reloadCommands() {
    const fetch = CommandIndexStore.Zn;
    const store = CommandIndexStore.Ay;

    if (typeof fetch !== "function" || !store) {
        Toasts.show({
            type: Toasts.Type.FAILURE,
            message: "SlashReload: internal Discord API not found",
            id: Toasts.genId(),
        });
        return;
    }

    const promises: Promise<any>[] = [];

    const userSymbol = Object.getOwnPropertySymbols(store.indices)
        .find(s => s.toString() === "Symbol(currentUser)");

    if (userSymbol) delete store.indices[userSymbol];
    promises.push(fetch({ type: "user" }).catch(console.error));

    for (const id of Object.keys(store.indices)) {
        if (GuildStore.getGuild(id)) {
            delete store.indices[id];
            promises.push(fetch({ type: "guild", guildId: id }).catch(console.error));
        } else if (ChannelStore.getChannel(id)) {
            delete store.indices[id];
            promises.push(fetch({ type: "channel", channelId: id }).catch(console.error));
        }
    }

    await Promise.all(promises);

    Toasts.show({
        type: Toasts.Type.SUCCESS,
        message: `Slash commands reloaded! (${promises.length} scopes)`,
        id: Toasts.genId(),
    });
}

const ReloadIcon: IconComponent = ({ height = 20, width = 20, className }) => (
    <svg
        aria-hidden="true"
        role="img"
        width={width}
        height={height}
        className={className}
        viewBox="0 0 24 24"
    >
        <path
            fill="currentColor"
            d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
        />
    </svg>
);

const ReloadSlashCommandsButton: ChatBarButtonFactory = ({ isAnyChat }) => {
    if (!isAnyChat) return null;

    return (
        <ChatBarButton
            tooltip="Reload Slash Commands"
            onClick={() => reloadCommands()}
        >
            <ReloadIcon />
        </ChatBarButton>
    );
};

export default definePlugin({
    name: "ReloadSlashCommands",
    description: "Reloads slash commands for all cached guilds, channels, and DMs for testing application commands.",
    authors: [{ name: "ren", id: 163734654040539136n }],

    dependencies: ["ChatInputButtonAPI"],

    chatBarButton: {
        icon: ReloadIcon,
        render: ReloadSlashCommandsButton,
    },

    start() {
        this.keyHandler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === "R") {
                e.preventDefault();
                reloadCommands();
            }
        };
        window.addEventListener("keydown", this.keyHandler);
    },

    stop() {
        window.removeEventListener("keydown", this.keyHandler);
    },
});