// Theme content for Fantasy Draft and Bidding War. Content only, no game logic.
// The engine reads this through the theme layer. "food" is built into the engine
// from the existing food cards and restaurants, so it is not listed here.
//
// DRAFT_THEMES[id] = {
//   name, blurb,                         // shown in the theme picker
//   icon: 'theme-<id>',                  // /art/theme-<id>.svg
//   slots: [{ id, label }],              // 4 or 5 slots, label like "a getaway driver"
//   cards: { <slotId>: [16 short items] },
//   prompts: [8 build prompts]           // e.g. "Build the heist crew that actually gets away"
// }
// AUCTION_THEMES[id] = {
//   name, blurb, icon: 'theme-<id>',
//   slots: [{ id, label }],              // what each winning bid fills
//   lots: [20 short names],              // what players bid on
//   nameItem: false,                     // true = winner types what they take from the lot (like food)
//   itemPrompt: '',                      // shown when nameItem is true, may use {lot}
//   prompts: [6 pitch prompts]
// }
export const DRAFT_THEMES = {
  vacation: {
    name: 'Dream Vacation',
    blurb: 'Draft the trip of a lifetime, or a total disaster.',
    icon: 'theme-vacation',
    slots: [
      { id: 'destination', label: 'a destination' },
      { id: 'stay', label: 'a place to stay' },
      { id: 'activity', label: 'an activity' },
      { id: 'buddy', label: 'a travel buddy' }
    ],
    cards: {
      destination: ['Tokyo', 'Paris', 'Hawaii', 'The Moon', "Grandma's House", 'Iceland', 'A Water Park', 'Antarctica', 'Las Vegas', 'The Grand Canyon', 'A Cruise Ship', 'A Tiny Island', 'Your Own Backyard', 'Rome', 'A Gas Station', 'Mount Everest'],
      stay: ['Five-Star Hotel', 'Treehouse', 'Igloo', 'Tent in the Rain', 'Castle', 'Houseboat', 'Your Car', 'Bunk Bed Hostel', 'Beach Hut', 'Haunted Inn', "Cousin's Couch", 'Airport Bench', 'Luxury Yacht', 'Cabin in the Woods', 'Underwater Hotel', 'Space Station'],
      activity: ['Surfing Lessons', 'Skydiving', 'Museum Tour', 'Napping All Day', 'Swimming with Sharks', 'Hot Air Balloon Ride', 'Karaoke Night', 'Zip Lining', 'Sandcastle Contest', 'Counting Pigeons', 'Volcano Hike', 'Theme Park Rides', 'Waiting in Line', 'Cooking Class', 'Whale Watching', 'Buying Fridge Magnets'],
      buddy: ['Your Best Friend', 'Your Grandpa', 'A Golden Retriever', 'A Tour Guide', 'Your Little Cousin', 'A Pirate', 'A Talking Parrot', 'A Famous Chef', 'Your Gym Teacher', 'A Mime', 'A Lifeguard', 'A Robot Butler', 'A Sleepy Koala', 'A Movie Star', 'Someone Who Snores', 'Your Mom']
    },
    prompts: [
      'Build the vacation everyone will want to hear about.',
      'Build the trip that makes the best photos.',
      'Build the most relaxing week ever.',
      'Build the vacation with the best story afterward.',
      'Build the trip you could survive with zero money.',
      'Build the perfect family vacation.',
      'Build the trip that would make your boss jealous.',
      'Build the vacation you would actually go on tomorrow.'
    ]
  },
  heist: {
    name: 'Heist Crew',
    blurb: 'Pick a crew and plan the getaway.',
    icon: 'theme-heist',
    slots: [
      { id: 'driver', label: 'a getaway driver' },
      { id: 'hacker', label: 'a hacker' },
      { id: 'disguise', label: 'a disguise' },
      { id: 'ride', label: 'a getaway ride' }
    ],
    cards: {
      driver: ['Stunt Driver', 'Your Grandma', 'Race Car Pro', 'Taxi Driver', 'Lost Tourist', 'Bus Driver', 'Ice Cream Truck Guy', 'A Cat', 'Getaway Expert', 'Student Driver', 'Pizza Delivery Guy', 'Retired Racer', 'A Toddler', 'Rally Champion', 'Bumper Car Kid', 'Someone Who Brakes Early'],
      hacker: ['Teen Genius', 'Grandpa with Email', 'Laptop Wizard', 'Hoodie Kid', 'Tech Support Guy', 'A Smart Fridge', 'Pro Gamer', 'Chess Champion', 'Password Guesser', 'A Very Smart Dog', 'Math Teacher', 'Satellite Expert', 'Keyboard Smasher', 'Coding Camp Grad', 'Movie Hacker', 'Someone Who Types Fast'],
      disguise: ['Fake Mustache', 'Tuxedo', 'Guard Uniform', 'Chicken Costume', 'Big Sunglasses', 'Delivery Uniform', 'Trench Coat', 'Clown Suit', 'Potted Plant', 'Fancy Ball Gown', 'Kids Stacked in Coat', 'Paper Bag Mask', 'Janitor Outfit', 'Wedding Dress', 'Astronaut Suit', 'Just a Name Tag'],
      ride: ['Sports Car', 'Motorcycle', 'Tandem Bike', 'Helicopter', 'Hot Air Balloon', 'Speedboat', 'Garbage Truck', 'Horse', 'Skateboard', 'Minivan', 'Shopping Cart', 'Monster Truck', 'City Bus', 'Jet Ski', 'Golf Cart', 'Rowboat']
    },
    prompts: [
      'Build the heist crew that actually gets away.',
      'Build the crew that could rob a museum at noon.',
      'Build the sneakiest crew in town.',
      'Build the crew most likely to get caught in five minutes.',
      'Build the crew that steals the last slice of pizza.',
      'Build the crew that would make the best movie.',
      'Build the crew you trust with your secret.',
      'Build the crew that pulls it off with style.'
    ]
  },
  zombie: {
    name: 'Zombie Survival',
    blurb: 'Gear up and see who lasts the night.',
    icon: 'theme-zombie',
    slots: [
      { id: 'weapon', label: 'a weapon' },
      { id: 'hideout', label: 'a hideout' },
      { id: 'snack', label: 'a snack' },
      { id: 'sidekick', label: 'a sidekick' }
    ],
    cards: {
      weapon: ['Baseball Bat', 'Frying Pan', 'Garden Rake', 'Leaf Blower', 'Pool Noodle', 'Crossbow', 'Katana', 'Rubber Chicken', 'Fire Extinguisher', 'Hockey Stick', 'Squirt Gun', 'Golf Club', 'Umbrella', 'Shovel', 'Tennis Racket', 'Rolled-Up Magazine'],
      hideout: ['Shopping Mall', 'Lighthouse', 'School Gym', 'Treehouse', 'Houseboat', 'Old Prison', 'Bowling Alley', 'Army Base', 'Movie Theater', "Grandma's Attic", 'Porta Potty', 'Castle', 'Farmhouse', 'Bank Vault', 'Ferris Wheel', 'Library'],
      snack: ['Canned Beans', 'Beef Jerky', 'Twinkies', 'Granola Bar', 'Peanut Butter Jar', 'Spam', 'Instant Noodles', 'Hot Sauce Packets', 'Dry Cereal', 'Birthday Cake', 'Pickles', 'Trail Mix', 'Ice Pop', 'Crackers', 'Gummy Bears', 'One Sad Carrot'],
      sidekick: ['Loyal Dog', 'Army Medic', 'Your Grandma', 'Farmer with a Truck', 'Scared Mall Cop', 'Park Ranger', 'A Toddler', 'Martial Arts Master', 'Know-It-All Nerd', 'Cat Who Ignores You', 'Nurse', 'Scout Troop', 'Friendly Zombie', 'Pizza Chef', 'Chatty Parrot', 'Retired Wrestler']
    },
    prompts: [
      'Build the team that survives the first night.',
      'Build the loadout that lasts a whole year.',
      'Build the setup that makes zombies turn around.',
      'Build the survival plan with the most style.',
      'Build the team that throws the best end-of-world party.',
      'Build the plan most likely to fail in one hour.',
      'Build the setup you would bet your life on.',
      'Build the team that saves the whole town.'
    ]
  },
  hoops: {
    name: 'Starting Five',
    blurb: 'Draft a starting five from any era.',
    icon: 'theme-hoops',
    slots: [
      { id: 'pg', label: 'a point guard' },
      { id: 'sg', label: 'a shooting guard' },
      { id: 'sf', label: 'a small forward' },
      { id: 'pf', label: 'a power forward' },
      { id: 'c', label: 'a center' }
    ],
    cards: {
      pg: ['Stephen Curry', 'Magic Johnson', 'Gary Payton', 'Sue Bird', 'Chris Paul', 'Steve Nash', 'Isiah Thomas', 'John Stockton', 'Allen Iverson', 'Russell Westbrook', 'Luka Doncic', 'Jason Kidd', 'Caitlin Clark', 'Damian Lillard', 'Shai Gilgeous-Alexander', 'Courtney Vandersloot'],
      sg: ['Michael Jordan', 'Kobe Bryant', 'Dwyane Wade', 'Ray Allen', 'Diana Taurasi', 'Klay Thompson', 'James Harden', 'Reggie Miller', 'Jewell Loyd', 'Anthony Edwards', 'Devin Booker', 'Arike Ogunbowale', 'Kelsey Plum', 'Jerry West', 'Manu Ginobili', 'Vince Carter'],
      sf: ['LeBron James', 'Larry Bird', 'Kevin Durant', 'Kawhi Leonard', 'Scottie Pippen', 'Maya Moore', 'Julius Erving', 'Jayson Tatum', 'Paul George', 'Carmelo Anthony', 'Elgin Baylor', 'Tamika Catchings', 'Detlef Schrempf', 'Jimmy Butler', 'Candace Parker', 'Rashard Lewis'],
      pf: ['Tim Duncan', 'Shawn Kemp', 'Breanna Stewart', 'Dirk Nowitzki', 'Giannis Antetokounmpo', 'Karl Malone', 'Kevin Garnett', 'Charles Barkley', 'Dennis Rodman', "A'ja Wilson", 'Blake Griffin', 'Pau Gasol', 'Napheesa Collier', 'Chris Webber', 'Anthony Davis', 'Draymond Green'],
      c: ["Shaquille O'Neal", 'Kareem Abdul-Jabbar', 'Hakeem Olajuwon', 'Bill Russell', 'Wilt Chamberlain', 'Nikola Jokic', 'Victor Wembanyama', 'Lisa Leslie', 'Brittney Griner', 'Yao Ming', 'Patrick Ewing', 'David Robinson', 'Joel Embiid', 'Lauren Jackson', 'Sylvia Fowles', 'Jack Sikma']
    },
    prompts: [
      'Build the starting five that wins a title.',
      'Build the most fun team to watch.',
      'Build the best defensive five ever.',
      'Build the team that wins a pickup game at the park.',
      'Build the five with the best team chemistry.',
      'Build the team that could beat any era.',
      'Build the starting five that sells out every arena.',
      'Build the team you would trust in a Game 7.'
    ]
  },
  date: {
    name: 'Perfect Date',
    blurb: 'Plan a date night to remember.',
    icon: 'theme-date',
    slots: [
      { id: 'place', label: 'a place' },
      { id: 'food', label: 'a food' },
      { id: 'outfit', label: 'an outfit' },
      { id: 'soundtrack', label: 'a soundtrack' }
    ],
    cards: {
      place: ['Rooftop Garden', 'Bowling Alley', 'Beach at Sunset', 'Aquarium', 'Laundromat', 'Mini Golf', 'Fancy Restaurant', 'Arcade', 'Planetarium', 'Farmers Market', 'Ice Rink', 'The DMV', 'Picnic in the Park', 'Karaoke Bar', 'Corn Maze', 'Parking Lot'],
      food: ['Sushi', 'Spaghetti', 'Tacos', 'Fondue', 'Garlic Bread', 'Cereal', 'Lobster', 'Hot Dogs', 'Midnight Pancakes', 'Spam Musubi', 'Street Corn', 'Chicken Wings', 'Shave Ice', 'Plain Rice', 'Chocolate Fountain', 'Onion Rings'],
      outfit: ['Tuxedo', 'Sundress', 'Hoodie and Sweats', 'Matching Outfits', 'Aloha Shirt', 'Cowboy Boots', 'Pajamas', 'Suit and Sneakers', 'Leather Jacket', 'Dinosaur Costume', 'Ball Gown', 'Soccer Jersey', 'Bathrobe', 'Sequin Jacket', 'Wet Swimsuit', 'Your Work Uniform'],
      soundtrack: ['Slow Jams', 'Jazz Piano', 'Ukulele Music', 'Elevator Music', 'Bagpipes', 'Eighties Hits', 'Country Ballads', 'Heavy Metal', 'Ocean Waves', 'Cartoon Theme Songs', 'Violin at the Table', 'Awkward Silence', 'Mariachi Band', 'Your Own Humming', 'Disco Hits', 'Whale Sounds']
    },
    prompts: [
      'Build the perfect first date.',
      'Build the date that ends with a second date.',
      'Build the most romantic night ever.',
      'Build the date your friends will never stop talking about.',
      'Build the date that costs under ten dollars.',
      'Build the date most likely to go wrong.',
      'Build the date for your fiftieth anniversary.',
      'Build the date that would win a reality show.'
    ]
  }
};

export const AUCTION_THEMES = {
  heist: {
    name: 'Heist Crew',
    blurb: 'Bid on crew members and pull off the job.',
    icon: 'theme-heist',
    slots: [
      { id: 'driver', label: 'a driver' },
      { id: 'hacker', label: 'a hacker' },
      { id: 'muscle', label: 'the muscle' },
      { id: 'mastermind', label: 'a mastermind' }
    ],
    lots: ['The Nervous Intern', 'The Retired Magician', 'The Smooth Talker', 'The Guy Who Knows a Guy', 'The Quiet Genius', 'The Ex-Stuntman', 'The Nosy Neighbor', 'The Master of Disguise', 'The Gym Coach', 'The Sleepy Security Guard', 'The Chess Grandma', 'The Know-It-All Teen', 'The Lucky Rookie', 'The Safe Cracker', 'The Clumsy Acrobat', 'The Pickpocket', 'The Mall Santa', 'The Sweaty Locksmith', 'The Bored Billionaire', 'The Trained Raccoon'],
    nameItem: false,
    itemPrompt: '',
    prompts: [
      'Pitch why your crew pulls off the job.',
      'Pitch your crew to a very nervous bank.',
      'Explain your getaway plan in one breath.',
      'Pitch the movie about your crew.',
      'Pitch why your crew never gets caught.',
      'Explain what goes wrong first and how you fix it.'
    ]
  },
  vacation: {
    name: 'Dream Vacation',
    blurb: 'Bid your way to the best trip.',
    icon: 'theme-vacation',
    slots: [
      { id: 'flight', label: 'the flight' },
      { id: 'stay', label: 'a place to stay' },
      { id: 'daytrip', label: 'a day trip' },
      { id: 'souvenir', label: 'a souvenir moment' }
    ],
    lots: ['First Class Seats', 'Middle Seat by the Bathroom', 'Beach Villa', 'Tokyo Food Tour', 'Paris Rooftop Dinner', 'Safari Jeep Ride', 'Northern Lights Cabin', 'Swim with Dolphins', 'Grand Canyon Helicopter', 'Hawaii Snorkel Trip', 'Castle Sleepover', 'Theme Park Fast Pass', 'Hot Spring Soak', 'Ski Chalet', 'Private Island Day', 'Gondola Ride in Venice', 'Camping in a Thunderstorm', 'Airport Layover Nap', 'Cruise Ship Buffet', 'Space Tourist Seat'],
    nameItem: false,
    itemPrompt: '',
    prompts: [
      'Pitch your trip like a travel ad.',
      'Pitch the trip to your grandma.',
      'Explain the best day of your trip.',
      'Pitch why your trip is worth every dollar.',
      'Describe the postcard you send home.',
      'Pitch your trip to someone who hates travel.'
    ]
  },
  hoops: {
    name: 'Starting Five',
    blurb: 'Fantasy auction draft with legends and stars.',
    icon: 'theme-hoops',
    slots: [
      { id: 'guard', label: 'a guard' },
      { id: 'wing', label: 'a wing' },
      { id: 'big', label: 'a big' },
      { id: 'sixth', label: 'a sixth man' }
    ],
    lots: ['Stephen Curry', 'Gary Payton', 'Sue Bird', 'Caitlin Clark', 'Michael Jordan', 'Kobe Bryant', 'Diana Taurasi', 'LeBron James', 'Kevin Durant', 'Breanna Stewart', 'Maya Moore', 'Shawn Kemp', "A'ja Wilson", 'Nikola Jokic', "Shaquille O'Neal", 'Victor Wembanyama', 'Lisa Leslie', 'Manu Ginobili', 'Giannis Antetokounmpo', 'Jewell Loyd'],
    nameItem: false,
    itemPrompt: '',
    prompts: [
      'Pitch why your team wins the title.',
      'Give your team a name and a pregame speech.',
      'Explain how your team closes out a tight game.',
      'Pitch your team to a sold-out arena.',
      'Pitch why you won the auction.',
      'Explain the one play your team runs every time.'
    ]
  },
  zombie: {
    name: 'Zombie Survival',
    blurb: 'Bid on places to raid before the zombies do.',
    icon: 'theme-zombie',
    slots: [
      { id: 'weapon', label: 'a weapon' },
      { id: 'food', label: 'food' },
      { id: 'supply', label: 'a shelter supply' },
      { id: 'luxury', label: 'a luxury' }
    ],
    lots: ['Costco', 'Hardware Store', 'Sporting Goods Store', 'Grocery Store', 'Pharmacy', 'Toy Store', 'Gas Station', 'Pet Store', 'Camping Store', 'Dollar Store', 'Bakery', 'Music Store', 'School Cafeteria', 'Garden Center', 'Bowling Alley', 'Farm Stand', 'Bookstore', 'Candy Shop', 'Fire Station', 'Movie Theater'],
    nameItem: true,
    itemPrompt: 'What do you grab from {lot}?',
    prompts: [
      'Pitch why your haul keeps you alive.',
      'Explain your first night with this stuff.',
      'Pitch your survival kit to a scared stranger.',
      'Explain which item saves the day and how.',
      'Pitch your haul like a late-night TV ad.',
      'Explain how you would survive a whole year.'
    ]
  },
  date: {
    name: 'Perfect Date',
    blurb: 'Bid on date spots and plan the night.',
    icon: 'theme-date',
    slots: [
      { id: 'first', label: 'the first stop' },
      { id: 'dinner', label: 'dinner' },
      { id: 'dessert', label: 'dessert' },
      { id: 'late', label: 'late night' }
    ],
    lots: ['Rooftop Bar', 'Bowling Alley', 'Beach Bonfire', 'Aquarium', 'Mini Golf', 'Fancy Steakhouse', 'Taco Truck', 'Ice Cream Parlor', 'Arcade', 'Karaoke Room', 'Drive-In Movie', 'Art Museum', 'Farmers Market', 'Sushi Counter', 'Night Market', 'Stargazing Hill', 'Ice Skating Rink', 'Late Night Diner', 'Pottery Class', 'Laundromat'],
    nameItem: false,
    itemPrompt: '',
    prompts: [
      'Pitch your date night in one breath.',
      'Pitch the date to someone you want to impress.',
      'Explain the best moment of the night.',
      'Pitch why this date leads to a second date.',
      'Describe the text you send the next morning.',
      'Pitch your date like a movie trailer.'
    ]
  }
};
