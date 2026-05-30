const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// Crucial line for rendering on a live server (Render/GitHub)
app.use(express.static(__dirname));

const CHANNEL_URL = 'https://t.me/s/sasta_store_offers';
let latestOffers = [];

async function fetchTelegramWeb() {
    try {
        const { data } = await axios.get(CHANNEL_URL);
        const $ = cheerio.load(data);
        const newOffers = [];

        $('.tgme_widget_message').each((i, el) => {
            const id = $(el).attr('data-post'); 
            const text = $(el).find('.tgme_widget_message_text').text();

            let imageUrl = null;
            const photoWrap = $(el).find('.tgme_widget_message_photo_wrap');
            if (photoWrap.length > 0) {
                const style = photoWrap.attr('style');
                const match = style.match(/url\('(.*?)'\)/);
                if (match) imageUrl = match[1];
            }

            if (text || imageUrl) {
                newOffers.unshift({
                    id: id ? id.split('/')[1] : null,
                    text: text || 'Exclusive Telegram Deal!',
                    image: imageUrl
                });
            }
        });

        latestOffers = newOffers.slice(0, 12);
        console.log(`[Success] Scraped ${latestOffers.length} offers from Telegram!`);

    } catch (error) {
        console.error("Error scraping Telegram:", error.message);
    }
}

fetchTelegramWeb();
setInterval(fetchTelegramWeb, 60000);

app.get('/api/offers', (req, res) => {
    res.json(latestOffers);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Web Scraper Server running on port ${PORT}`);
    console.log(`Listening to public channel: ${CHANNEL_URL}`);
});
