const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.static(__dirname));
// Your public channel URL
const CHANNEL_URL = 'https://t.me/s/sasta_store_offers';
let latestOffers = [];

async function fetchTelegramWeb() {
    try {
        // 1. Visit the public webpage of your channel
        const { data } = await axios.get(CHANNEL_URL);
        
        // 2. Load the HTML
        const $ = cheerio.load(data);
        const newOffers = [];

        // 3. Find every message bubble on the page
        $('.tgme_widget_message').each((i, el) => {
            const id = $(el).attr('data-post'); 
            const text = $(el).find('.tgme_widget_message_text').text();

            // 4. Find the image if it exists
            let imageUrl = null;
            const photoWrap = $(el).find('.tgme_widget_message_photo_wrap');
            if (photoWrap.length > 0) {
                const style = photoWrap.attr('style');
                // Extract the raw image URL from the background-image CSS
                const match = style.match(/url\('(.*?)'\)/);
                if (match) imageUrl = match[1];
            }

            // 5. Save the offer
            if (text || imageUrl) {
                newOffers.unshift({
                    id: id ? id.split('/')[1] : null,
                    text: text || 'Exclusive Telegram Deal!',
                    image: imageUrl
                });
            }
        });

        // 6. Keep only the latest 12 deals to prevent the website from lagging
        latestOffers = newOffers.slice(0, 12);
        console.log(`[Success] Scraped ${latestOffers.length} offers from Telegram!`);

    } catch (error) {
        console.error("Error scraping Telegram:", error.message);
    }
}

// Fetch immediately when the server starts...
fetchTelegramWeb();

// ...and then automatically check for new posts every 60 seconds
setInterval(fetchTelegramWeb, 60000);

// API Endpoint for your HTML website
app.get('/api/offers', (req, res) => {
    res.json(latestOffers);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Web Scraper Server running on http://localhost:${PORT}`);
    console.log(`Listening to public channel: ${CHANNEL_URL}`);
});