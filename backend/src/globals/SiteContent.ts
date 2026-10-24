import type { GlobalConfig, TextareaField, TextField } from 'payload';
import { authenticated } from '@/hooks/authenticated';

// The texts on the shop's homepage (and the thank-you page), one tab per
// block. The shop reads this in shop/src/lib/content.server.ts. An empty field
// means "use the standard text": that text is shown greyed out in the field,
// so you see what's on the site before you change it.

const text = (name: string, label: string, standard: string, description?: string, width?: string): TextField => ({
    name,
    label,
    type: 'text',
    admin: { placeholder: standard, description, width },
});

const textarea = (name: string, label: string, standard: string, description?: string): TextareaField => ({
    name,
    label,
    type: 'textarea',
    admin: { placeholder: standard, description },
});

const PARAGRAPHS = 'Elke regel wordt een eigen alinea.';

export const SiteContent: GlobalConfig = {
    slug: 'site-content',
    label: 'Teksten',
    admin: {
        group: 'Website',
        description: 'Leeg laten = de standaardtekst (grijs in het veld) blijft staan.',
    },
    access: {
        read: authenticated,
        update: authenticated,
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    name: 'hero',
                    label: 'Bovenaan',
                    description: 'Het eerste blok: titel, knoppen en het venster met de producten.',
                    fields: [
                        text('annotation', 'Klein boven de titel', 'NULNANUL'),
                        text('title', 'Titel', 'drop_001'),
                        textarea('intro', 'Tekst onder de titel', '', `Optioneel. ${PARAGRAPHS}`),
                        {
                            type: 'row',
                            fields: [text('button', 'Gele knop', 'get fly →', 'Gaat naar de winkel.', '50%'), text('epLink', 'Link ernaast', "mama's tuin →", "Opent het mama's tuin-venster.", '50%')],
                        },
                        text('windowTitle', 'Titel van het fotovenster', 'rojo_angelo.jpg'),
                    ],
                },
                {
                    name: 'shop',
                    label: 'Winkel',
                    fields: [text('title', 'Titel boven de producten', 'winkel')],
                },
                {
                    name: 'drop',
                    label: 'Drop-venster',
                    description: 'Het venster drop_001 op de desktop.',
                    fields: [text('windowTitle', 'Titel van het venster', 'drop_001'), text('path', 'Pad bovenin', 'c:\\southsidedinero\\drop_001')],
                },
                {
                    name: 'ep',
                    label: "mama's tuin",
                    description: 'Het EP-venster. De nummers zelf (audio) staan in de code: shop/src/data/ep.ts.',
                    fields: [
                        text('annotation', 'Klein boven de titel', 'ep · southsidedinero'),
                        {
                            type: 'row',
                            fields: [text('title', 'Titel', "mama's tuin", undefined, '50%'), text('artist', 'Artiest', 'su00ki', undefined, '50%')],
                        },
                        {
                            type: 'row',
                            fields: [text('year', 'Jaar', '2026', undefined, '33%'), text('summary', 'Samenvatting', '5 songs, 9 min 27 sec', undefined, '33%'), text('released', 'Uit sinds', '18 september 2026', undefined, '33%')],
                        },
                        {
                            type: 'row',
                            fields: [text('listenLabel', 'Tekst Spotify-link', 'luister op spotify →', undefined, '50%'), text('youtubeLabel', 'Tekst YouTube-link', 'bekijk op youtube →', undefined, '50%')],
                        },
                    ],
                },
                {
                    name: 'about',
                    label: 'Southsidedinero-venster',
                    description: 'Het venster met het roermoney-logo op de desktop.',
                    fields: [text('windowTitle', 'Titel van het venster', 'southsidedinero'), text('title', 'Kop', 'roertje'), textarea('content', 'Tekst', 'enne', PARAGRAPHS)],
                },
                {
                    name: 'locked',
                    label: 'Inlogscherm',
                    description: 'Wat bezoekers zien zolang de site op slot staat.',
                    fields: [text('desktopText', 'Tekst op de desktop', 'drop_001 soon come soon come'), text('loginText', 'Tekst in het inlogvenster', 'holdonnnn')],
                },
                {
                    name: 'footer',
                    label: 'Footer',
                    fields: [
                        text('copyright', 'Copyright', '© southsidedinero 2026'),
                        {
                            name: 'links',
                            label: 'Links',
                            type: 'array',
                            labels: { singular: 'Link', plural: 'Links' },
                            admin: { description: 'Leeg = Algemene voorwaarden en Privacy (nog zonder pagina).' },
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'label', label: 'Tekst', type: 'text', required: true, admin: { width: '50%' } },
                                        { name: 'url', label: 'Link', type: 'text', required: true, admin: { width: '50%', placeholder: 'https://…' } },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'thanks',
                    label: 'Na het betalen',
                    description: 'De pagina waar kopers na Stripe op landen.',
                    fields: [text('paidTitle', 'Titel (betaald)', 'bedankt', 'De voornaam van de koper komt erachter, bijv. "bedankt amir."'), textarea('paidText', 'Tekst (betaald)', 'je bestelling is binnen. de bevestiging staat in je mail, we laten het weten zodra hij onderweg is.'), text('pendingTitle', 'Titel (betaling nog bezig)', 'bijna.'), textarea('pendingText', 'Tekst (betaling nog bezig)', 'we zien je betaling nog niet. betaalde je met een methode die wat langer duurt, dan krijg je een mail zodra hij rond is.')],
                },
            ],
        },
    ],
};
