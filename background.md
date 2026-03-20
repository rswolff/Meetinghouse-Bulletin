Three congregations, called "wards" meet in the same building at different times of the day.

The three wards are named, "Bowness Ward", "Rockyview Ward" and "Arbour Lake Ward".

Each of these wards hold a one hour worship service each Sunday. One ward starts at 9:00AM, the next ward starts at 10:30 and the final ward starts at 12:00.

Each ward has a webpage for it's own weekly announcements. 

I would like to deploy a QR code to the hymnals with an embedded URL. Depending on the time of day, the url should redirect to the associated ward announcements website. 

For example, scanning the QR code at the following times should take the following actions:

Sunday 8:00AM-10:00AM - redirect to the Rockyview Ward website
Sunday 10:00AM-11:30AM - redirect to the Arbour Lake Ward website
Sunday 11:30-1:00PM - redirect to the Bowness Ward Website

At all other times the QR code should point to a landing page that has links to all three ward websites.

I would like to build a website that will redirect to the appropriate ward website given the schedule above. The website should be static pages so that it can be deployed for free using a statis webhost service like Digital Ocean App platform, Cloudflare or something similar. 

Recommend an approach for building and deploying a website that will function as described above. Include technology stack options and an evaluation of what to consider when making the decision.