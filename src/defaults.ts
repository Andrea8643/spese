import type { Category, Settings } from './types'

const sub = (id: string, name: string, keywords: string[] = []) => ({ id, name, keywords })

export const DEFAULT_CATEGORIES: Category[] = [
  // ───────────── NECESSITÀ ─────────────
  {
    id: 'alimentari', name: 'Alimentari', icon: '🛒', group: 'necessita', budgetPct: 25,
    subs: [
      sub('supermercato', 'Supermercato', [
        'conad', 'lidl', 'coop', 'esselunga', 'eurospin', 'aldi', 'md discount', 'md ', 'penny', 'carrefour',
        'pam', 'despar', 'spar', 'interspar', 'eurospar', 'famila', 'iper', 'ipercoop', 'bennet', 'tigre', 'sigma',
        'crai', 'todis', 'in s', 'ins mercato', 'tuodi', 'deco', 'decò', 'simply', 'unes', 'il gigante', 'tosano',
        'supermercato', 'spesa', 'alimentari', 'market', 'minimarket', 'discount', 'frutta', 'verdura',
        'macelleria', 'panificio', 'pane', 'latte', 'uova', 'pasta', 'mercato', 'fruttivendolo', 'salumeria',
        'acqua', 'pescheria', 'ld', 'ld market', 'paghi poco', 'prix', 'dpiu', 'd piu', 'ard', 'ard discount', 'emi', 'basko', 'gros', 'il centro', 'mercatò', 'mercato', 'sole 365', 'conad city', 'conad superstore', 'carne', 'pollo', 'pesce', 'formaggio', 'yogurt', 'biscotti', 'cereali', 'riso', 'tonno', 'banane', 'mele', 'insalata', 'pomodori', 'surgelati', 'detersivo', 'carta igienica', 'scottex', 'sapone piatti', 'prodotti casa', 'casa',
      ]),
    ],
  },
  {
    id: 'trasporti', name: 'Trasporti', icon: '⛽', group: 'necessita', budgetPct: 39,
    subs: [
      sub('carburante', 'Carburante (GPL)', [
        'benzina', 'diesel', 'gasolio', 'carburante', 'rifornimento', 'pieno', 'eni', 'enilive', 'q8', 'ip ',
        'tamoil', 'esso', 'shell', 'api ', 'agip', 'distributore', 'gpl', 'metano', 'self', 'ip', 'api', 'beyfin', 'repsol', 'total', 'totalerg', 'erg', 'ewa', 'pompa',
      ]),
      sub('parcheggi', 'Parcheggi e pedaggi', ['parcheggio', 'pedaggio', 'autostrada', 'telepass', 'easypark', 'strisce blu', 'ztl', 'casello', 'parchimetro', 'park', 'garage', 'autosilo', 'multa', 'contravvenzione', 'tutor', 'autovelox', 'myCicero', 'mycicero', 'telepass pay',
      ]),
      sub('lavaggio', 'Lavaggio auto', ['lavaggio', 'autolavaggio', 'aspirapolvere auto', 'self wash', 'lavaggio interni', 'profumatore auto', 'arbre magique',
      ]),
    ],
  },
  {
    id: 'fondo-auto', name: 'Fondo auto', icon: '🚗', group: 'necessita', budgetPct: 25, fund: true,
    subs: [
      sub('assicurazione', 'Assicurazione', ['assicurazione', 'rca', 'polizza', 'unipol', 'generali', 'allianz', 'prima assicurazioni', 'linear', 'genertel', 'verti', 'zurich', 'conte', 'conte.it', 'facile.it', 'quixa', 'directline', 'cattolica', 'reale mutua', 'sara assicurazioni', 'groupama', 'axa', 'vittoria assicurazioni', 'rca auto', 'kasko', 'furto incendio', 'cristalli',
      ]),
      sub('bollo', 'Bollo', ['bollo', 'bollo auto', 'tassa automobilistica', 'passaggio di proprieta', 'pra', 'pratica auto',
      ]),
      sub('revisione', 'Revisione', ['revisione', 'revisione auto', 'collaudo',
      ]),
      sub('manutenzione', 'Manutenzione e tagliandi', [
        'tagliando', 'meccanico', 'officina', 'gomme', 'pneumatici', 'gommista', 'olio motore', 'cambio olio',
        'freni', 'pastiglie', 'batteria auto', 'carrozziere', 'carrozzeria', 'ricambi', 'filtro', 'cinghia', 'frizione', 'tergicristalli', 'lampadina auto', 'liquido', 'antigelo', 'catene', 'gomme invernali', 'convergenza', 'carrozzeria', 'ammortizzatori', 'autoricambi', 'norauto', 'euro auto', 'aci',
      ]),
    ],
  },
  {
    id: 'salute', name: 'Salute', icon: '💊', group: 'necessita', budgetPct: 6,
    subs: [
      sub('farmacia', 'Farmacia', ['farmacia', 'farmaco', 'medicina', 'medicinale', 'tachipirina', 'oki', 'moment', 'parafarmacia', 'cerotti', 'ibuprofene', 'aspirina', 'vitamine', 'collirio', 'sciroppo', 'antibiotico', 'pillola', 'termometro', 'mascherine', 'lenti a contatto', 'lenti',
      ]),
      sub('visite', 'Visite mediche', ['visita', 'medico', 'dentista', 'ticket', 'oculista', 'analisi', 'esami', 'fisioterapia', 'fisioterapista', 'dermatologo', 'ospedale', 'specialista', 'radiografia', 'ecografia', 'risonanza', 'cup', 'certificato medico', 'ortopedico', 'nutrizionista', 'psicologo', 'osteopata', 'pronto soccorso', 'vaccino', 'otorino', 'ginecologo', 'urologo', 'cardiologo', 'apparecchio denti', 'pulizia denti', 'igienista',
      ]),
    ],
  },
  {
    id: 'telefono', name: 'Telefono', icon: '📱', group: 'necessita', budgetPct: 5,
    subs: [
      sub('ricarica', 'Ricarica / abbonamento', ['ricarica telefonica', 'ricarica tim', 'ricarica vodafone', 'tim', 'vodafone', 'windtre', 'wind', 'iliad', 'ho mobile', 'ho.', 'kena', 'very mobile', 'fastweb', 'postemobile', 'coopvoce', 'sim', 'offerta telefonica', 'ricarica cellulare', 'ricarica', 'credito telefonico', 'bolletta telefono', 'abbonamento telefono', 'rata telefono', 'tiscali', 'spusu', 'lyca', 'lycamobile', 'tim ricarica',
      ]),
    ],
  },

  // ───────────── PERSONALE ─────────────
  {
    id: 'ristoranti', name: 'Ristoranti & Fast food', icon: '🍔', group: 'personale', budgetPct: 30,
    subs: [
      sub('fastfood', 'Fast food', [
        'mcdonald', 'mc donald', 'mcdonalds', 'mac donald', 'mc ', 'burger king', 'bk ', 'kfc', 'old wild west',
        'roadhouse', "o'tacos", 'otacos', 'o tacos', 'montacos', 'tacos', 'kebab', 'kebap', 'doner', 'piadina',
        'burger', 'hamburger', 'panino', 'panini', 'subway', 'poke', 'five guys', 'alice pizza', 'cheesburger',
        'cheeseburger', 'patatine', 'nuggets', 'wrap', 'hot dog', 'fritto', 'mcdrive', 'mc drive', 'king', 'burgerking', 'popeyes', 'wendys', 'chicken', 'pollo fritto', 'arrosticini', 'friggitoria', 'rosticceria', 'tavola calda', 'focaccia', 'trancio', 'pizza al taglio', 'crescione', 'tigella', 'gnocco fritto', 'arancino', 'arancini', 'supplì', 'calzone', 'kebabbaro', 'doner kebab', 'durum', 'falafel', 'burrito', 'nachos', 'temakinho', 'spontini', 'old wild', 'america graffiti', 'ham holy burger', 'baobab', 'fast food',
      ]),
      sub('ristorante', 'Ristorante & Pizzeria', [
        'ristorante', 'pizzeria', 'pizza', 'sushi', 'giapponese', 'cinese', 'indiano', 'messicano', 'trattoria',
        'osteria', 'all you can eat', 'ayce', 'cena', 'pranzo fuori', 'braceria', 'steakhouse', 'agriturismo',
        'ramen', 'thai', 'hamburgeria', 'hamburgeria', 'brace', 'grigliata', 'carbonara', 'cena fuori', 'uramaki', 'nigiri', 'poke house', 'wok', 'kebab ristorante', 'pescheria ristorante', 'bistrot', 'enoteca', 'tapas', 'piadineria', 'roadhouse grill',
      ]),
      sub('delivery', 'Delivery', ['just eat', 'justeat', 'deliveroo', 'glovo', 'uber eats', 'ubereats', 'delivery', 'domicilio', 'consegna', 'asporto', 'take away', 'takeaway',
      ]),
    ],
  },
  {
    id: 'bar', name: 'Bar & Snack', icon: '☕', group: 'personale', budgetPct: 8,
    subs: [
      sub('caffe', 'Bar & Caffè', ['caffe', 'caffè', 'cappuccino', 'cornetto', 'brioche', 'colazione', 'bar ', 'aperitivo', 'spritz', 'birra', 'cocktail', 'pub', 'gelato', 'gelateria', 'pasticceria', 'starbucks', 'caffetteria', 'espresso', 'te', 'tè', 'thè', 'ginseng', 'succo', 'spremuta', 'tramezzino', 'toast', 'croissant', 'pasticcini', 'birretta', 'negroni', 'mojito', 'gin tonic', 'shottino', 'shot', 'amaro', 'vino', 'calice', 'happy hour', 'apericena', 'bubble tea', 'crepe', 'crepes', 'donut', 'ciambella', 'frappe', 'frullato', 'milkshake', 'mcflurry',
      ]),
      sub('distributori', 'Distributori & Snack', [
        'macchinetta', 'distributore automatico', 'vending', 'coca', 'coca cola', 'cocacola', 'coca zero', 'pepsi',
        'fanta', 'sprite', 'red bull', 'redbull', 'monster', 'energy drink', 'snack', 'merendina', 'patatine',
        'cioccolato', 'kinder', 'bibita', 'lattina', 'chips', 'matipay', 'coffee cap', 'coffeecap', 'pay4vend', 'selecta', 'macchinette', 'distributori', 'snack automatico', 'acqua macchinetta', 'caffe macchinetta', 'ricarica macchinetta', 'chiavetta', 'saldo chiavetta', 'gatorade', 'powerade', 'estathe', 'estate', 'the freddo', 'thè freddo', 'lipton', 'oreo', 'pringles', 'mars', 'snickers', 'twix', 'bounty', 'kitkat', 'kit kat', 'm&m', 'mentine', 'chewing gum', 'gomme da masticare', 'caramelle', 'haribo', 'tic tac', 'schweppes', 'chinotto', 'aranciata', 'gassosa', '7up',
      ]),
    ],
  },
  {
    id: 'fitness', name: 'Fitness & Sport', icon: '🏋️', group: 'personale', budgetPct: 5,
    subs: [
      sub('palestra', 'Palestra', ['palestra', 'abbonamento palestra', 'mcfit', 'mc fit', 'virgin active', 'anytime fitness', 'fit express', 'personal trainer', 'crossfit', 'piscina', 'corso', 'quota palestra', 'iscrizione palestra', 'mensile palestra', 'boxe', 'kickboxing', 'mma', 'calcetto', 'padel', 'tennis', 'campo', 'yoga', 'pilates', 'spinning', 'nuoto', 'arti marziali', 'karate', 'judo', 'ingresso piscina', 'arrampicata', 'golf',
      ]),
      sub('attrezzatura', 'Attrezzatura', ['tapis roulant', 'tapirulan', 'tapisroulant', 'manubri', 'pesi', 'bilanciere', 'kettlebell', 'panca', 'cyclette', 'tappetino', 'elastici', 'decathlon', 'attrezzatura', 'walking pad', 'walkingpad', 'treadmill', 'tapis', 'roulant', 'rullo', 'ellittica', 'vogatore', 'spin bike', 'bike', 'sbarra', 'trazioni', 'parallele', 'dischi', 'step', 'corda', 'fitball', 'foam roller', 'guantoni', 'paradenti', 'cardiofrequenzimetro', 'borraccia', 'shaker', 'bilancia', 'pallone', 'racchetta', 'pinne', 'occhialini',
      ]),
      sub('integratori', 'Integratori', ['integratori', 'integratore', 'proteine', 'whey', 'creatina', 'myprotein', 'prozis', 'barretta proteica', 'amminoacidi', 'bcaa', 'multivitaminico', 'protein', 'barretta', 'barrette', 'glutammina', 'omega', 'magnesio', 'potassio', 'zinco', 'vitamina', 'pre workout', 'preworkout', 'caffeina', 'gainer', 'collagene', 'enervit', 'yamamoto', 'foodspring', 'bulk',
      ]),
      sub('abbigliamento-sport', 'Abbigliamento sportivo', ['scarpe running', 'abbigliamento sportivo', 'tuta', 'leggings', 'canotta', 'pantaloncini', 'shorts', 'calze sportive', 'reggiseno sportivo', 'maglia tecnica', 'kway', 'k way', 'giacca running', 'under armour', 'gymshark', 'scarpe palestra', 'scarpe da corsa', 'scarpe calcio', 'scarpini', 'asics', 'mizuno', 'brooks', 'hoka', 'saucony',
      ]),
    ],
  },
  {
    id: 'abbigliamento', name: 'Abbigliamento & Scarpe', icon: '👕', group: 'personale', budgetPct: 12,
    subs: [
      sub('vestiti', 'Vestiti', ['zara', 'h&m', 'hm ', 'pull&bear', 'pull and bear', 'bershka', 'primark', 'ovs', 'jack&jones', 'jack and jones', 'maglietta', 'maglia', 'felpa', 'jeans', 'pantaloni', 'giacca', 'giubbotto', 'camicia', 'vestiti', 'shein', 'zalando', 'calzini', 'boxer', 'intimo', 'new yorker', 'newyorker', 'kiabi', 'terranova', 'tezenis', 'calzedonia', 'intimissimi', 'yamamay', 'oviesse', 'coin', 'upim', 'piazza italia', 'benetton', 'united colors', 'sisley', 'motivi', 'stradivarius', 'mango', 'uniqlo', 'celio', 'jack jones', 'levis', 'levi', 'tommy hilfiger', 'calvin klein', 'lacoste', 'ralph lauren', 'guess', 'diesel', 'carhartt', 'the north face', 'north face', 'napapijri', 'colmar', 'moncler', 'stone island', 'asos', 'vinted', 'temu', 'aliexpress', 'outlet', 'saldi', 'abbigliamento', 'abito', 'vestito', 'completo', 'gonna', 'top', 'canottiera', 'pigiama', 'cappotto', 'piumino', 'gilet', 'maglione', 'cardigan', 'polo', 't shirt', 'tshirt', 'maglietta', 'pantalone', 'jogger', 'tuta', 'cargo', 'bermuda', 'costume', 'calza', 'mutande', 'slip', 'sciarpa', 'guanti', 'berretto', 'cappellino', 'cravatta',
      ]),
      sub('scarpe', 'Scarpe', ['scarpe', 'sneakers', 'nike', 'adidas', 'new balance', 'puma', 'foot locker', 'footlocker', 'snipes', 'aw lab', 'ciabatte', 'scarpa', 'stivali', 'stivaletti', 'anfibi', 'mocassini', 'sandali', 'infradito', 'crocs', 'converse', 'vans', 'timberland', 'dr martens', 'clarks', 'geox', 'skechers', 'reebok', 'jordan', 'air force', 'air max', 'yeezy', 'deichmann', 'pittarello', 'scarpe e scarpe', 'bata', 'jd sports', 'jd',
      ]),
      sub('accessori', 'Accessori', ['cappello', 'occhiali', 'orologio', 'zaino', 'borsa', 'portafoglio', 'cintura', 'collana', 'bracciale', 'cintura', 'portachiavi', 'ombrello', 'occhiali da sole', 'ray ban', 'rayban', 'anello', 'orecchini', 'pandora', 'swarovski', 'marsupio', 'borsello', 'valigia', 'trolley', 'eastpak', 'invicta', 'zaino scuola',
      ]),
    ],
  },
  {
    id: 'tecnologia', name: 'Tecnologia', icon: '🎮', group: 'personale', budgetPct: 7,
    subs: [
      sub('elettronica', 'Elettronica', ['iphone', 'samsung', 'smartphone', 'cuffie', 'airpods', 'cavo', 'caricatore', 'cover', 'pc', 'computer', 'tablet', 'ipad', 'monitor', 'mouse', 'tastiera', 'mediaworld', 'unieuro', 'euronics', 'apple', 'amazon', 'powerbank', 'smartwatch', 'mediamarkt', 'trony', 'expert', 'comet', 'apple store', 'xiaomi', 'huawei', 'oneplus', 'oppo', 'pixel', 'macbook', 'laptop', 'notebook', 'portatile', 'scheda video', 'ssd', 'hard disk', 'chiavetta usb', 'usb', 'hdmi', 'adattatore', 'presa', 'prolunga', 'cassa bluetooth', 'speaker', 'jbl', 'bose', 'sony', 'echo', 'alexa', 'smart tv', 'televisore', 'tv', 'stampante', 'webcam', 'microfono', 'auricolari', 'pellicola', 'vetro temperato', 'custodia', 'apple watch', 'garmin', 'fitbit', 'kindle', 'gopro', 'drone', 'lampada', 'led', 'ventilatore', 'stufetta', 'phon', 'piastra', 'regolarbarba', 'tagliacapelli', 'rasoio elettrico', 'philips', 'braun', 'dyson',
      ]),
      sub('videogiochi', 'Videogiochi', ['playstation', 'ps5', 'ps4', 'xbox', 'nintendo', 'switch', 'videogioco', 'gioco', 'steam', 'fortnite', 'v-bucks', 'fifa', 'ea fc', 'gamestop', 'psn', 'ps plus', 'game', 'gaming', 'joystick', 'controller', 'dualsense', 'cuffie gaming', 'console', 'gioco ps5', 'gioco switch', 'call of duty', 'cod', 'gta', 'minecraft', 'roblox', 'robux', 'valorant', 'league of legends', 'twitch', 'skin', 'battle pass', 'epic games', 'nintendo eshop', 'eshop', 'instant gaming', 'g2a',
      ]),
    ],
  },
  {
    id: 'svago', name: 'Svago & Uscite', icon: '🎉', group: 'personale', budgetPct: 12,
    subs: [
      sub('uscite', 'Uscite & Serate', ['discoteca', 'serata', 'locale', 'festa', 'ingresso', 'compleanno', 'bowling', 'sala giochi', 'karaoke', 'tabacchi', 'sigarette', 'svapo', 'gratta e vinci', 'scommessa', 'serata', 'drink', 'prevendita', 'tavolo', 'privè', 'prive', 'lista', 'guardaroba', 'biliardo', 'freccette', 'escape room', 'luna park', 'giostre', 'lotteria', 'superenalotto', 'lotto', 'snai', 'sisal', 'bet', 'eurobet', 'iqos', 'heets', 'terea', 'tabacco', 'cartine', 'filtri', 'accendino', 'liquidi svapo',
      ]),
      sub('eventi', 'Cinema & Eventi', ['cinema', 'film', 'concerto', 'teatro', 'stadio', 'partita', 'museo', 'mostra', 'evento', 'ticketone', 'biglietto concerto', 'uci', 'the space', 'vivaticket', 'dice', 'eventbrite', 'ticketmaster', 'abbonamento stadio', 'curva', 'tribuna', 'festival', 'fiera', 'acquario', 'zoo', 'parco divertimenti', 'gardaland', 'mirabilandia', 'acquapark', 'parco acquatico', 'terme', 'spa',
      ]),
      sub('hobby', 'Hobby & Libri', ['libro', 'libri', 'feltrinelli', 'mondadori', 'fumetto', 'manga', 'hobby', 'giornale', 'rivista', 'audible', 'carta', 'cancelleria', 'quaderno', 'penna', 'puzzle', 'lego', 'modellismo', 'chitarra', 'corde', 'pittura', 'colori', 'carte pokemon', 'pokemon', 'figurine', 'panini figurine',
      ]),
    ],
  },
  {
    id: 'abbonamenti', name: 'Abbonamenti digitali', icon: '📺', group: 'personale', budgetPct: 8,
    subs: [
      sub('streaming', 'Streaming & App', ['netflix', 'spotify', 'disney', 'prime video', 'amazon prime', 'dazn', 'now tv', 'sky', 'youtube premium', 'apple music', 'icloud', 'google one', 'playstation plus', 'ps plus', 'game pass', 'chatgpt', 'claude', 'abbonamento app', 'crunchyroll', 'paramount', 'apple tv', 'appletv', 'timvision', 'infinity', 'discovery', 'mubi', 'tidal', 'deezer', 'amazon music', 'audible', 'duolingo', 'canva', 'adobe', 'microsoft 365', 'office', 'onedrive', 'dropbox', 'nordvpn', 'vpn', 'tinder', 'bumble', 'hinge', 'onlyfans', 'patreon', 'abbonamento', 'rinnovo',
      ]),
    ],
  },
  {
    id: 'cura', name: 'Cura personale', icon: '💈', group: 'personale', budgetPct: 5,
    subs: [
      sub('barbiere', 'Barbiere', ['barbiere', 'parrucchiere', 'taglio', 'capelli', 'barba', 'barber', 'barber shop', 'barbershop', 'sfumatura', 'rasatura', 'piega', 'tinta', 'colpi di sole', 'estetista', 'manicure', 'pedicure', 'ceretta', 'massaggio', 'solarium', 'lampada abbronzante',
      ]),
      sub('prodotti', 'Prodotti & Profumi', ['profumo', 'deodorante', 'shampoo', 'balsamo', 'crema', 'rasoio', 'lamette', 'dopobarba', 'cera', 'gel', 'sephora', 'douglas', 'acqua e sapone', 'tigota', 'tigotà', 'bagnoschiuma', 'dentifricio', 'spazzolino', 'kiko', 'lush', 'the body shop', 'yves rocher', 'nyx', 'mac cosmetics', 'trucco', 'makeup', 'mascara', 'rossetto', 'fondotinta', 'smalto', 'crema viso', 'siero', 'protezione solare', 'solare', 'doccia schiuma', 'saponetta', 'cotton fioc', 'filo interdentale', 'collutorio', 'pettine', 'spazzola', 'fragranza', 'acqua di colonia', 'colonia', 'eau de toilette', 'eau de parfum', 'tiger', 'acqua & sapone', 'pinalli', 'marionnaud', 'beauty star',
      ]),
    ],
  },
  {
    id: 'viaggi', name: 'Viaggi', icon: '✈️', group: 'personale', budgetPct: 6,
    subs: [
      sub('viaggi', 'Viaggi & Vacanze', ['volo', 'aereo', 'ryanair', 'easyjet', 'wizz', 'hotel', 'albergo', 'airbnb', 'booking', 'b&b', 'bnb', 'vacanza', 'viaggio', 'weekend', 'traghetto', 'ostello', 'vueling', 'ita airways', 'volotea', 'lufthansa', 'alitalia', 'skyscanner', 'expedia', 'edreams', 'lastminute', 'trivago', 'agoda', 'hostelworld', 'campeggio', 'camping', 'resort', 'crociera', 'msc', 'costa crociere', 'pernottamento', 'notte', 'escursione', 'tour', 'gita', 'souvenir', 'tassa di soggiorno', 'noleggio auto', 'autonoleggio', 'bagaglio', 'check in',
      ]),
    ],
  },
  {
    id: 'regali', name: 'Regali', icon: '🎁', group: 'personale', budgetPct: 4,
    subs: [sub('regali', 'Regali', ['regalo', 'regali', 'pensierino', 'fiori', 'mazzo di fiori', 'festa della mamma', 'san valentino', 'natale', 'compleanno regalo', 'gift card', 'buono regalo', 'cesto', 'bomboniera', 'fiorista', 'peluche', 'gioielleria', 'gioiello',
      ])],
  },
  {
    id: 'altro', name: 'Altro', icon: '📦', group: 'personale', budgetPct: 3,
    subs: [sub('varie', 'Varie', ['varie', 'altro', 'commissione', 'commissioni', 'spedizione', 'posta', 'raccomandata', 'francobolli', 'bancomat prelievo', 'canone', 'tassa', 'marca da bollo', 'donazione', 'beneficenza', 'animali', 'veterinario', 'crocchette', 'lavanderia', 'tintoria', 'calzolaio', 'chiavi', 'fotocopie', 'stampa',
      ])],
  },
]

export const DEFAULT_INCOME_SOURCES = ['Stipendio', 'Straordinari', 'Rimborso', 'Altro']

export function catPctFrom(categories: Category[]): Record<string, number> {
  return Object.fromEntries(categories.map((c) => [c.id, c.budgetPct]))
}

export function defaultSettings(startMonth: string): Settings {
  const allocation = {
    savingsPct: 60,
    needsPct: 20,
    personalPct: 20,
    catPct: catPctFrom(DEFAULT_CATEGORIES),
  }
  return {
    categories: DEFAULT_CATEGORIES,
    allocation,
    allocationHistory: { [startMonth]: allocation },
    startMonth,
    initialSavings: 434,
    initialFund: 0,
    initialVouchers: 0,
    voucherValue: 8,
    expectedIncome: 1800,
    incomeSources: DEFAULT_INCOME_SOURCES,
    recapSeen: [],
  }
}

/** Spese ricorrenti iniziali (aggiunte una volta sola). */
export const SEED_RECURRING = [
  { key: 'claude', type: 'expense', description: 'Claude', amount: 20, categoryId: 'abbonamenti', subId: 'streaming', method: 'carta', frequency: 'monthly', day: 1 },
  { key: 'prime', type: 'expense', description: 'Amazon Prime', amount: 4.99, categoryId: 'abbonamenti', subId: 'streaming', method: 'carta', frequency: 'monthly', day: 1 },
  { key: 'icloud', type: 'expense', description: 'iCloud+ (spazio Apple)', amount: 1.99, categoryId: 'abbonamenti', subId: 'streaming', method: 'carta', frequency: 'monthly', day: 1 },
  { key: 'fitactive', type: 'expense', description: 'Fit Active Settimo – abbonamento 12 mesi', amount: 239.88, categoryId: 'fitness', subId: 'palestra', method: 'carta', frequency: 'yearly', day: 1, month: 6 },
] as const
