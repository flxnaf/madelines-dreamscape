// =============================================================================
// DIALOGUES.JS - All NPC dialogue content
// =============================================================================

const DIALOGUES = {
  'The Mind Wanderer': {
    initial: {
      speaker: 'The Mind Wanderer',
      text: 'Ah, another soul lost in the dreamscape. I\'ve been wandering here for what feels like ages. Are you seeking something, or are you simply lost?',
      choices: [
        { text: 'I\'m looking for a way out', action: 'seekExit', npc: 'The Mind Wanderer' },
        { text: 'What is this place?', action: 'askAboutWorld', npc: 'The Mind Wanderer' },
        { text: 'You\'re just a wandering ghost, useless!', action: 'angerWanderer', npc: 'The Mind Wanderer', isAngry: true }
      ]
    },
    seekExit: {
      speaker: 'The Mind Wanderer',
      text: 'Leaving is not as simple as walking back through the door you entered. This dreamscape has its own rules. You must find the Dream Nexus - it\'s the heart of this realm. Only there can you discover the way out. Safe travels, little one.',
      choices: []
    },
    askAboutWorld: {
      speaker: 'The Mind Wanderer',
      text: 'This is Madeline\'s Dreamscape - a realm born from her deepest thoughts, fears, and memories. Time flows differently here. What feels like moments could be hours, or vice versa. Be careful what you choose... your actions ripple through this world in ways you cannot predict.',
      choices: []
    },
    angerWanderer: {
      speaker: 'The Mind Wanderer',
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
    initial: {
      speaker: 'Dream Guardian',
      text: 'I guard the deeper realms of this dream - the places where shadows grow long and memories become tangible. Few make it this far. What brings you to my threshold, little wanderer?',
      choices: [
        { text: 'I\'m just exploring', action: 'exploring', npc: 'Dream Guardian' },
        { text: 'I need to find Madeline', action: 'findMadeline', npc: 'Dream Guardian' },
        { text: 'What are you guarding?', action: 'whatGuarding', npc: 'Dream Guardian' }
      ]
    },
    exploring: {
      speaker: 'Dream Guardian',
      text: 'Curiosity is both a gift and a curse in dreams. You might find wonders beyond imagination... or horrors you cannot unsee. The deeper realms are not for the faint of heart. But if you\'re determined, I won\'t stop you. Proceed with caution.',
      choices: []
    },
    findMadeline: {
      speaker: 'Dream Guardian',
      text: 'Madeline is everywhere and nowhere in this realm. She IS this dream. But to truly reach her consciousness, to communicate with the dreamer herself... you must venture into the Dream Nexus. It lies beyond my post. Steel yourself - it won\'t be easy.',
      choices: []
    },
    whatGuarding: {
      speaker: 'Dream Guardian',
      text: 'I guard the boundary between surface dreams and deep memories - the place where Madeline\'s subconscious truly resides. Beyond me lies vulnerability, raw emotion, and unfiltered truth. Not everyone is ready to face such things. That is why I stand watch.',
      choices: []
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

