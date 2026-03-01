import type { CollectionEntry } from "astro:content";

export const getVisiblePosts = (posts: CollectionEntry<"posts">[]) => {
    return posts.filter((post) => {
        // If status is not set (e.g., legacy post), assume it's 'terbit'
        const status = post.data.status || "terbit";

        if (status === "draft" || status === "takedown") {
            return false;
        }

        if (status === "terjadwal") {
            const pubDate = post.data.pubdate ? new Date(post.data.pubdate).getTime() : 0;
            const now = new Date().getTime();
            return pubDate <= now;
        }

        return true; // "terbit"
    });
};
