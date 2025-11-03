// =============================================================================
// DIALOGUES.JS - All NPC dialogue content
// =============================================================================

const DIALOGUES = {
  'Sorrow': {
    initial: {
      speaker: 'Sorrow',
      text: 'Ah, another soul lost in the dreamscape. I\'ve been wandering here for what feels like ages. Are you seeking something, or are you simply lost?',
      choices: [
        { text: 'I\'m looking for a way out', action: 'seekExit', npc: 'Sorrow' },
        { text: 'What is this place?', action: 'askAboutWorld', npc: 'Sorrow' },
        { text: 'You\'re just a wandering ghost, useless!', action: 'angerWanderer', npc: 'Sorrow', isAngry: true }
      ]
    },
    seekExit: {
      speaker: 'Sorrow',
      text: 'Leaving is not as simple as walking back through the door you entered. This dreamscape has its own rules. You must find the Dream Nexus - it\'s the heart of this realm. Only there can you discover the way out. Safe travels, little one.',
      choices: []
    },
    askAboutWorld: {
      speaker: 'Sorrow',
      text: 'This is Madeline\'s Dreamscape - a realm born from her deepest thoughts, fears, and memories. Time flows differently here. What feels like moments could be hours, or vice versa. Be careful what you choose... your actions ripple through this world in ways you cannot predict.',
      choices: []
    },
    angerWanderer: {
      speaker: 'Sorrow',
      text: 'USELESS?! I have wandered these paths for eons, learning every secret, every hidden corner! You dare mock my journey? Then let me show you what happens when you lose your way in a realm of infinite paths. Walk through MY maze of colors... if you can!',
      choices: [],
      triggersSwirl: true
    }
  },
  
  'Echo': {
    initial: {
      speaker: 'Echo',
      text: 'I am Echo. I reflect the thoughts that drift through this dreamscape. You seem... confused. That\'s normal here. Most visitors are. What weighs on your mind?',
      choices: [
        { text: 'How do I leave this place?', action: 'howToLeave', npc: 'Echo' },
        { text: 'Who is Madeline?', action: 'whoIsMadeline', npc: 'Echo' },
        { text: 'You\'re nothing but a fake reflection!', action: 'angerEcho', npc: 'Echo', isAngry: true }
      ]
    },
    howToLeave: {
      speaker: 'Echo',
      text: 'To leave, you must understand why you came. Were you drawn here by curiosity? Fate? Or something else? The dreamscape holds answers, but only for those who truly seek them. Reflect on your purpose, and the path will reveal itself.',
      choices: []
    },
    whoIsMadeline: {
      speaker: 'Echo',
      text: 'Madeline is the dreamer - the architect of this entire realm. Every building, every shadow, every color you see exists within her mind. We are all reflections of her thoughts. You are but a visitor in her consciousness, a ripple in her dream.',
      choices: []
    },
    whatAreYou: {
      speaker: 'Echo',
      text: 'I am... complicated. A reflection, a memory, a thought given form. I exist because Madeline needs me to. I speak the truths she cannot face while awake. In dreams, we can be honest. Perhaps too honest.',
      choices: []
    },
    angerEcho: {
      speaker: 'Echo',
      text: 'FAKE?! You dare question my existence? I am as real as you are in this realm! If you think reflections hold no power... let me show you what happens when you shatter them. Come... face the consequences of your words!',
      choices: [],
      triggersSwirl: true
    }
  },
  
  'Dream Guardian': {
    introGreeting: {
      speaker: 'Dream Guardian',
      text: 'Ectopaws... I have been expecting you. Follow me to my chamber. I have something important to give you.',
      choices: [
        { text: 'Okay', action: 'followGuardian', npc: 'Dream Guardian' }
      ]
    },
    followGuardian: {
      speaker: 'Dream Guardian',
      text: 'Come, the door is now open.',
      choices: [],
      completesIntro: true
    },
    initial: {
      speaker: 'Dream Guardian',
      text: 'Ectopaws... I have been expecting you. Madeline\'s nightmare grows stronger each moment. You must save her before she is lost forever. Come to my chamber, and I will give you what you need.',
      choices: [
        { text: 'What do I need?', action: 'whatINeed', npc: 'Dream Guardian' },
        { text: 'How do I save her?', action: 'howToSave', npc: 'Dream Guardian' },
        { text: 'Take me to your chamber', action: 'toRoom', npc: 'Dream Guardian' }
      ]
    },
    fourSouls: {
      speaker: 'Dream Guardian',
      text: 'Ectopaws... you have done well. Four souls... but one more is needed. Please, come to my sanctum. We must speak.',
      choices: [
        { text: 'I\'ll come', action: 'toSanctum', npc: 'Dream Guardian' }
      ]
    },
    whatINeed: {
      speaker: 'Dream Guardian',
      text: 'To traverse the dreamscape and face the nightmares within, you need power. I can grant you the Ghost Pepper - an essence that will allow you to dash through dangers. But you must come to my chamber to receive it.',
      choices: [
        { text: 'Take me to your chamber', action: 'toRoom', npc: 'Dream Guardian' }
      ]
    },
    howToSave: {
      speaker: 'Dream Guardian',
      text: 'Madeline\'s soul is fragmented, scattered across the dreamscape. You must collect the lost souls - fragments of her psyche - to make her whole again. But first, you need the power to reach them. Come to my chamber.',
      choices: [
        { text: 'Take me to your chamber', action: 'toRoom', npc: 'Dream Guardian' }
      ]
    },
    toRoom: {
      speaker: 'Dream Guardian',
      text: 'Follow me. The door to the left leads to my chamber. There, I will bestow upon you the Ghost Pepper.',
      choices: [],
      guidesToDoor2: true
    },
    toSanctum: {
      speaker: 'Dream Guardian',
      text: 'Come to my sanctum - through Door 2 on the left. I will be waiting.',
      choices: []
    },
    inRoom2: {
      speaker: 'Dream Guardian',
      text: 'This is my sanctum. I am part ghost myself, bound to this realm. Take this Ghost Pepper - it contains the essence of speed and ethereality, allowing you to traverse the dreamscape like I do. With it, you can DASH through obstacles and doors. Hold SHIFT and move to dash!',
      choices: [
        { text: 'Thank you', action: 'whatNext', npc: 'Dream Guardian' }
      ]
    },
    inRoom2FourSouls: {
      speaker: 'Dream Guardian',
      text: 'Ectopaws... to fix Madeline\'s spirit, you must unlock the cage in the top-right of the dreamscape. But the barrier requires 5 souls. You have 4. There is only one way...',
      choices: [
        { text: 'What do you mean?', action: 'sacrifice1', npc: 'Dream Guardian' }
      ]
    },
    sacrifice1: {
      speaker: 'Dream Guardian',
      text: 'I am prepared to give you my soul. I am a fragment of her consciousness, just like the others. With my soul, you will have the 5 needed to free Madeline\'s spirit.',
      choices: [
        { text: 'Are you sure?', action: 'sacrifice2', npc: 'Dream Guardian' }
      ]
    },
    sacrifice2: {
      speaker: 'Dream Guardian',
      text: 'This is my purpose, Ectopaws. To guide you here, to help you save her. Now... it is time for me to become one with the dreamscape. Goodbye, little friend. Thank you for everything.',
      choices: [
        { text: '[Accept the soul]', action: 'acceptSoul', npc: 'Dream Guardian' }
      ]
    },
    acceptSoul: {
      speaker: 'Dream Guardian',
      text: 'Go now... free Madeline...',
      choices: [],
      givesGuardianSoul: true,
      turnsGuardianToStatue: true
    },
    whatNext: {
      speaker: 'Dream Guardian',
      text: 'Explore the mansion. Behind Door 3 lives Echo, a soul fragment you must save. Behind Door 1 lies a path to the greater dreamscape. Use your dash to unlock these paths. Go now - Madeline needs you!',
      choices: [],
      givesGhostPepper: true
    }
  },
  
  'King of Greed': {
    initial: {
      speaker: 'King of Greed',
      text: 'Once, I ruled many cities. I wanted more, always more. Gold, land, power... it was never enough. Now I am alone in this crumbling tower, king of nothing but dust and regret.',
      choices: [
        { text: '[Continue]', action: 'ladder', npc: 'King of Greed' }
      ]
    },
    ladder: {
      speaker: 'King of Greed',
      text: 'You have climbed all this way to reach me. I shall give you a way down - a ladder will appear to take you back to the first floor. But there is one more thing I can offer...',
      choices: [
        { text: '[Continue]', action: 'soulOffer', npc: 'King of Greed' }
      ],
      showsLadder: true
    },
    soulOffer: {
      speaker: 'King of Greed',
      text: 'My soul. Take it with you. Perhaps you can do better with it than I did. When you take it, I will turn to stone like the others. Are you ready?',
      choices: [
        { text: '[Take the Soul of Greed]', action: 'takeSoul', npc: 'King of Greed' }
      ]
    },
    takeSoul: {
      speaker: 'King of Greed',
      text: 'It is done. Learn from my mistakes, traveler. Do not let greed consume you as it did me.',
      choices: [],
      givesSoul: true,
      turnsToStatue: true
    }
  },
  
  'sans': {
    initial: {
      speaker: 'sans',
      text: 'heya. nice to meet ya. i\'m sans, sans the skeleton. you look like you\'re having a bad time. actually, wait, scratch that. you\'re a cat. cats always have a good time. anyway, i heard you\'re looking for a cabin. i might have a key.',
      choices: [
        { text: 'How do I get the key?', action: 'serious', npc: 'sans' },
        { text: 'Do you want to have a bad time?', action: 'funny', npc: 'sans' }
      ]
    },
    serious: {
      speaker: 'sans',
      text: 'woah, straight to business huh? i dunno, i\'m feeling pretty lazy today. maybe come back later.',
      choices: []
    },
    funny: {
      speaker: 'sans',
      text: 'heh heh heh. i like your style, kid. tell you what, here\'s the key to the cabin. don\'t say i never did anything for ya.',
      choices: [],
      givesCabinKey: true
    }
  },
  
  'Rath': {
    initial: {
      speaker: 'Rath',
      text: 'Welcome, traveler. I am Rath, guardian of forgotten melodies. Long ago, I lost my temper and burned away what I loved most. Now I seek peace through music. Would you like to hear my song?',
      choices: [
        { text: 'Yes, I\'d like to hear it', action: 'playPiano', npc: 'Rath' },
        { text: 'What happened to you?', action: 'yourStory', npc: 'Rath' },
        { text: 'Not now', action: 'decline', npc: 'Rath' }
      ]
    },
    yourStory: {
      speaker: 'Rath',
      text: 'My anger consumed everything - my kingdom, my family, even myself. All that remains is this cave and this piano. Music is the only way I can express what words cannot. Will you listen?',
      choices: [
        { text: 'Yes, play for me', action: 'playPiano', npc: 'Rath' },
        { text: 'Maybe later', action: 'decline', npc: 'Rath' }
      ]
    },
    decline: {
      speaker: 'Rath',
      text: 'I understand. The piano will be here when you\'re ready.',
      choices: []
    },
    playPiano: {
      speaker: 'Rath',
      text: 'Listen carefully... this melody holds a piece of me. Play it back to me, and I will give you my soul.',
      choices: [],
      triggersPiano: true
    }
  }
};

// Helper function to get dialogue
function getDialogue(npcName, action = 'initial') {
  if (DIALOGUES[npcName] && DIALOGUES[npcName][action]) {
    return DIALOGUES[npcName][action];
  }
  // Default fallback
  return {
    speaker: npcName,
    text: 'Hello, traveler.',
    choices: []
  };
}

