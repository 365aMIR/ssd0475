// mama's tuin — su00ki, released on southsidedinero.
export const ep = {
    title: "mama's tuin",
    artist: 'su00ki',
    year: 2026,
    released: '18 september 2026',
    summary: '5 songs, 9 min 27 sec',
    cover: '/img/shop/mamas-tuin.jpg',
    /**
     * The clip on YouTube. Embedded plays count as views on the channel, so this
     * wins over a self-hosted file when both are set.
     */
    youtubeId: 'ZFv8O5fPh4Q' as string | null,
    /** Fallback: a file in public/video/. null (and no youtubeId) shows a placeholder. */
    video: null as string | null,
    /** Still shown before the clip plays. */
    videoPoster: null as string | null,
    /** Index into tracks of the song the clip belongs to. */
    videoTrack: 1,
    /** Streaming link for the "luister op spotify" button. */
    listenUrl: 'https://open.spotify.com/album/4UL3AhI1aCbYfXipHFyzOk' as string | null,
    /** Spotify album id for the embedded player. null hides it. */
    spotifyAlbumId: '4UL3AhI1aCbYfXipHFyzOk' as string | null,
    /**
     * Audio lives in public/mamastuin/. The site plays the mp3s; the .wav
     * masters next to them are kept out of git and the Docker image.
     */
    tracks: [
        { title: 'splash&stack', time: '1:55', file: '/mamastuin/splash&stack.mp3' },
        { title: 'hoorikvaak', time: '2:14', file: '/mamastuin/hoorikvaak.mp3' },
        { title: 'terugnazuid', time: '1:57', file: '/mamastuin/terugnazuid.mp3' },
        { title: 'stepdoorfotto', time: '1:28', file: '/mamastuin/stepdoorfotto.mp3' },
        { title: 'opstaan&doorgaan', time: '1:52', file: '/mamastuin/opstaan&doorgaan.mp3' },
    ],
};
