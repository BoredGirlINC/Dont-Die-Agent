import './style.css';
import { auth } from './firebase';
import { authService } from './services/auth';
import { blueprintService } from './services/blueprint';
import { marked } from 'marked';

// State management
let currentUser = null;
let currentBlueprint = null;
let isProcessing = false;
let currentEmojiSlot = null;
let userEmojis = ['😊', '👍', '🎉']; // Default emojis

// DOM Elements
const loginButton = document.getElementById('login-button');
const profileButton = document.getElementById('profile-button');
const authModal = document.getElementById('auth-modal');
const signupModal = document.getElementById('signup-modal');
const profileSection = document.getElementById('profile-section');
const blueprintSection = document.getElementById('blueprint-section');
const chatSection = document.getElementById('chat-section');
const getBlueprintButton = document.getElementById('get-blueprint-button');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendMessageButton = document.getElementById('send-message');
const loadingIndicator = document.getElementById('loading-indicator');
const blueprintFormModal = document.getElementById('blueprint-form-modal');
const blueprintResultModal = document.getElementById('blueprint-result-modal');
const blueprintForm = document.getElementById('blueprint-form');
const saveBlueprintButton = document.getElementById('save-blueprint');
const emojiModal = document.getElementById('emoji-modal');
const emojiGrid = document.getElementById('emoji-grid');
const emojiSearch = document.getElementById('emoji-search');
const currentSelection = document.getElementById('current-selection').querySelector('div');
const saveEmojiButton = document.getElementById('save-emoji');

// Toast notification function
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-[#56c271] text-white' : 'bg-[#e05263] text-white'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
}

// Auth state observer
auth.onAuthStateChanged((user) => {
  const wasSignedOut = !currentUser && user;
  currentUser = user;
  updateUI();
  
  // If user just logged in
  if (wasSignedOut) {
    // Close any open modals
    authModal.classList.remove('modal-open');
    signupModal.classList.remove('modal-open');
    
    // Show profile page and success toast
    showProfilePage();
    showToast('You logged in successfully!');
  }
});

// UI update function
function updateUI() {
  const isLoggedIn = !!currentUser;
  
  // Update navigation
  loginButton.style.display = isLoggedIn ? 'none' : 'block';
  profileButton.style.display = isLoggedIn ? 'block' : 'none';
}

// Function to show profile page
function showProfilePage() {
  profileSection.style.display = 'block';
  blueprintSection.style.display = 'none';
  chatSection.style.display = 'none';
  
  if (currentUser) {
    document.getElementById('profile-name').textContent = currentUser.displayName || 'User';
    document.getElementById('profile-bio').textContent = currentUser.bio || 'No bio yet';
    
    if (currentUser.photoURL) {
      document.getElementById('profile-image').src = currentUser.photoURL;
    }
    
    // Load user's emojis
    loadUserEmojis();
    
    loadUserBlueprints();
  }
}

// Function to load user blueprints
async function loadUserBlueprints() {
  try {
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
    
    const blueprints = await blueprintService.getUserBlueprints(currentUser.uid);
    renderBlueprints(blueprints);
  } catch (error) {
    console.error('Error loading blueprints:', error);
    showToast('Failed to load blueprints', 'error');
  } finally {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
}

// Function to load user's emojis
async function loadUserEmojis() {
  try {
    const userData = await authService.getUserProfile(currentUser.uid);
    if (userData && userData.emojis) {
      userEmojis = userData.emojis;
      updateEmojiDisplay();
    }
  } catch (error) {
    console.error('Error loading user emojis:', error);
  }
}

// Function to update emoji display in profile
function updateEmojiDisplay() {
  const emojiSlots = document.querySelectorAll('.emoji-slot');
  emojiSlots.forEach((slot, index) => {
    if (index < userEmojis.length) {
      slot.textContent = userEmojis[index];
    }
  });
}

// Function to save user emojis
async function saveUserEmojis() {
  if (!currentUser) return;
  
  try {
    await authService.updateUserProfile(currentUser, { emojis: userEmojis });
    showToast('Emojis updated successfully!');
  } catch (error) {
    console.error('Error saving emojis:', error);
    showToast('Failed to save emojis', 'error');
  }
}

// Generate emoji grid
function generateEmojiGrid(category = 'smileys') {
  // Define emoji sets by category
  const emojiSets = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩'],
    people: ['👋', '🤚', '✋', '🖖', '👌', '🤌', '🤏', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄'],
    food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🌮', '🍕', '🍔', '🍟', '🍗', '🍖', '🥩', '🍤', '🍰'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽'],
    travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '✈️', '🚀', '🛸', '🚁'],
    objects: ['💡', '🔦', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🔨', '⚒', '🛠', '⛏', '🪚', '🔩', '⚙️', '🧱', '⏱', '📱', '💻', '🖥', '🖨', '🕹', '📷'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️']
  };

  // Get emojis for the selected category
  const emojis = emojiSets[category] || emojiSets.smileys;
  
  // Clear the grid
  emojiGrid.innerHTML = '';
  
  // Generate buttons for each emoji
  emojis.forEach(emoji => {
    const button = document.createElement('button');
    button.className = 'emoji-btn p-2 text-2xl hover:bg-[#fef4f8] rounded cursor-pointer';
    button.textContent = emoji;
    button.addEventListener('click', () => {
      currentSelection.textContent = emoji;
    });
    emojiGrid.appendChild(button);
  });
}

// Initialize emoji handlers
function initEmojiHandlers() {
  // Attach click event to emoji slots
  const emojiSlots = document.querySelectorAll('.emoji-slot');
  emojiSlots.forEach((slot, index) => {
    slot.addEventListener('click', () => {
      currentEmojiSlot = index;
      currentSelection.textContent = userEmojis[index];
      emojiModal.classList.add('modal-open');
    });
  });
  
  // Attach click events to emoji categories
  const emojiCategories = document.querySelectorAll('.emoji-category');
  emojiCategories.forEach(button => {
    button.addEventListener('click', () => {
      generateEmojiGrid(button.dataset.category);
    });
  });
  
  // Save emoji button
  saveEmojiButton.addEventListener('click', () => {
    if (currentEmojiSlot !== null && currentEmojiSlot < userEmojis.length) {
      userEmojis[currentEmojiSlot] = currentSelection.textContent;
      updateEmojiDisplay();
      saveUserEmojis();
      emojiModal.classList.remove('modal-open');
    }
  });
  
  // Emoji search
  emojiSearch.addEventListener('input', () => {
    const searchTerm = emojiSearch.value.toLowerCase();
    const allEmojis = Array.from(document.querySelectorAll('.emoji-btn'));
    
    allEmojis.forEach(btn => {
      // This is a simple search - in a real app, you'd want to search
      // emoji names/descriptions which would require a mapping
      btn.style.display = 'block';
    });
  });
  
  // Initial emoji grid
  generateEmojiGrid('smileys');
}

// Document ready function to initialize the app
document.addEventListener('DOMContentLoaded', () => {
  initEmojiHandlers();
});

// Event Listeners
loginButton.addEventListener('click', () => {
  authModal.classList.add('modal-open');
});

// Google Sign In
document.getElementById('google-signin').addEventListener('click', async () => {
  try {
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
    
    // Check if Firebase is properly configured
    if (auth.app.options.apiKey === "" || !auth.app.options.apiKey) {
      throw new Error("Firebase configuration is incomplete. Please check your Firebase credentials.");
    }
    
    await authService.signInWithGoogle();
    authModal.classList.remove('modal-open');
  } catch (error) {
    console.error('Google sign in error:', error);
    
    // Show more specific error messages
    let errorMessage = 'Failed to sign in with Google. ';
    
    if (error.message.includes('Firebase configuration is incomplete')) {
      errorMessage += 'Firebase configuration is missing or invalid. Please check your API keys.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage += 'Sign-in was cancelled.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage += 'Sign-in window was closed before completing the process.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage += 'Pop-up was blocked by the browser. Please allow pop-ups for this site.';
    } else if (error.code === 'auth/api-key-not-valid') {
      errorMessage += 'Firebase API key is invalid. Please update your Firebase configuration.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage += 'An account already exists with the same email address but different sign-in credentials.';
    } else {
      errorMessage += error.message || '';
    }
    
    showToast(errorMessage, 'error');
  } finally {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
});

// Twitter Sign In
document.getElementById('twitter-signin').addEventListener('click', async () => {
  try {
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
    
    // Check if Firebase is properly configured
    if (auth.app.options.apiKey === "" || !auth.app.options.apiKey) {
      throw new Error("Firebase configuration is incomplete. Please check your Firebase credentials.");
    }
    
    await authService.signInWithTwitter();
    authModal.classList.remove('modal-open');
  } catch (error) {
    console.error('Twitter sign in error:', error);
    
    // Show more specific error messages
    let errorMessage = 'Failed to sign in with Twitter. ';
    
    if (error.message.includes('Firebase configuration is incomplete')) {
      errorMessage += 'Firebase configuration is missing or invalid. Please check your API keys.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage += 'Sign-in was cancelled.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage += 'Sign-in window was closed before completing the process.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage += 'Pop-up was blocked by the browser. Please allow pop-ups for this site.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = `Twitter sign-in is currently experiencing issues. Please try another sign-in method or contact support.
      
This error typically means that the Twitter API configuration needs to be updated in Firebase. (Error: auth/invalid-credential)`;
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage += 'An account already exists with the same email address but different sign-in credentials.';
    } else {
      errorMessage += error.message || '';
    }
    
    showToast(errorMessage, 'error');
  } finally {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
});

document.getElementById('email-signin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;
  
  try {
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
    
    // Check if Firebase is properly configured
    if (auth.app.options.apiKey === "" || !auth.app.options.apiKey) {
      throw new Error("Firebase configuration is incomplete. Please check your Firebase credentials.");
    }
    
    await authService.signInWithEmail(email, password);
    authModal.classList.remove('modal-open');
    e.target.reset();
  } catch (error) {
    console.error('Email sign in error:', error);
    
    // Show more specific error messages
    let errorMessage = 'Failed to sign in with email. ';
    
    if (error.message.includes('Firebase configuration is incomplete')) {
      errorMessage += 'Firebase configuration is missing or invalid. Please check your API keys.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage += 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage += 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage += 'Invalid email format.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage += 'Too many failed attempts. Please try again later.';
    } else if (error.code === 'auth/api-key-not-valid') {
      errorMessage += 'Firebase API key is invalid. Please update your Firebase configuration.';
    } else {
      errorMessage += 'Please check your credentials.';
    }
    
    showToast(errorMessage, 'error');
  } finally {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
});

// Open signup modal
document.getElementById('open-signup-modal').addEventListener('click', () => {
  authModal.classList.remove('modal-open');
  signupModal.classList.add('modal-open');
});

// Back to signin
document.getElementById('back-to-signin').addEventListener('click', () => {
  signupModal.classList.remove('modal-open');
  authModal.classList.add('modal-open');
});

// Handle signup form submission
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alias = e.target.alias.value;
  const email = e.target.email.value;
  const password = e.target.password.value;
  
  try {
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
    
    // Check if Firebase is properly configured
    if (auth.app.options.apiKey === "" || !auth.app.options.apiKey) {
      throw new Error("Firebase configuration is incomplete. Please check your Firebase credentials.");
    }
    
    // Create the user
    const user = await authService.signUpWithEmail(email, password);
    
    // Update the display name
    await authService.updateUserProfile(user, {
      displayName: alias
    });
    
    signupModal.classList.remove('modal-open');
    e.target.reset();
    showToast('Account created successfully!');
  } catch (error) {
    console.error('Signup error:', error);
    
    // Show more specific error messages
    let errorMessage = 'Failed to create account. ';
    
    if (error.message.includes('Firebase configuration is incomplete')) {
      errorMessage += 'Firebase configuration is missing or invalid. Please check your API keys.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage += 'This email is already registered.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage += 'Password is too weak. Please use a stronger password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage += 'Invalid email format.';
    } else if (error.code === 'auth/api-key-not-valid') {
      errorMessage += 'Firebase API key is invalid. Please update your Firebase configuration.';
    } else {
      errorMessage += error.message || '';
    }
    
    showToast(errorMessage, 'error');
  } finally {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
});

profileButton.addEventListener('click', () => {
  showProfilePage();
});

getBlueprintButton.addEventListener('click', () => {
  blueprintFormModal.classList.add('modal-open');
});

// Sign out button
document.getElementById('sign-out').addEventListener('click', async () => {
  try {
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
    
    // Perform sign out
    await authService.signOut();
    
    // Clear any cached user data
    currentUser = null;
    
    // Reset UI state
    profileSection.style.display = 'none';
    blueprintSection.style.display = 'block';
    chatSection.style.display = 'block';
    
    // Clear any sensitive data from the page
    document.getElementById('profile-name').textContent = 'User Name';
    document.getElementById('profile-bio').textContent = 'Bio';
    document.getElementById('profile-image').src = '/src/assets/character.png';
    document.getElementById('blueprints-container').innerHTML = '';
    
    showToast('You have been signed out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
    showToast('Failed to sign out: ' + (error.message || ''), 'error');
  } finally {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
});

blueprintForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    name: e.target.name.value,
    city: e.target.city.value,
    country: e.target.country.value,
    dietaryRestrictions: e.target.dietaryRestrictions.value,
    exercisePreferences: e.target.exercisePreferences.value
  };
  
  try {
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
    blueprintFormModal.classList.remove('modal-open');
    
    // Prepare the prompt
    const prompt = `Generate a detailed and well-formatted personalized health blueprint in Markdown format for ${formData.name} living in ${formData.city}, ${formData.country}. 
    Dietary options: ${formData.dietaryRestrictions || 'no specific options'}. 
    Exercise preferences: ${formData.exercisePreferences || 'no specific preferences'}. 
    Include sections for diet plan (with meal suggestions), exercise routine, sleep optimization, and mental health practices. 
    Make all recommendations specific, actionable, and tailored to the user's preferences. 
    Format the response in clear sections with emojis for better readability.`;
    
    const response = await fetch('https://r0c8kgwocscg8gsokogwwsw4.zetaverse.one/ai', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer IhjtISImRdUQLJYTKZgVoB0cM773',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: [{
            type: "text",
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();
    if (data && data.message) {
      currentBlueprint = data.message;
      document.getElementById('blueprint-result-content').innerHTML = marked.parse(data.message);
      blueprintResultModal.classList.add('modal-open');
    }
  } catch (error) {
    console.error('Error generating blueprint:', error);
    showToast('Failed to generate blueprint', 'error');
  } finally {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
});

saveBlueprintButton.addEventListener('click', async () => {
  if (!currentUser) {
    blueprintResultModal.classList.remove('modal-open');
    authModal.classList.add('modal-open');
    return;
  }
  
  try {
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
    
    const blueprintId = await blueprintService.saveBlueprint(
      currentUser.uid,
      currentBlueprint,
      ''
    );
    
    showToast('Blueprint saved successfully!');
    blueprintResultModal.classList.remove('modal-open');
  } catch (error) {
    console.error('Error saving blueprint:', error);
    showToast('Failed to save blueprint', 'error');
  } finally {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
});

// Chat functionality
sendMessageButton.addEventListener('click', sendMessage);

async function sendMessage() {
  if (isProcessing || !chatInput.value.trim()) return;
  
  const userMessage = chatInput.value.trim();
  chatInput.value = '';
  
  // Add user message to chat
  addMessageToChat('user', userMessage);
  
  // Show loading state
  isProcessing = true;
  loadingIndicator.classList.remove('hidden');
  loadingIndicator.classList.add('flex');
  
  try {
    const response = await fetch('https://r0c8kgwocscg8gsokogwwsw4.zetaverse.one/ai', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer IhjtISImRdUQLJYTKZgVoB0cM773',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: [{
            type: "text",
            text: userMessage
          }]
        }]
      })
    });

    const data = await response.json();
    if (data && data.message) {
      addMessageToChat('assistant', data.message);
    } else {
      addMessageToChat('assistant', "I apologize, but I'm having trouble processing your request. Please try again.");
    }
  } catch (error) {
    console.error('Error sending message:', error);
    addMessageToChat('assistant', "I apologize, but I'm having trouble connecting. Please try again.");
  } finally {
    isProcessing = false;
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
}

function addMessageToChat(role, message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat chat-${role === 'user' ? 'end' : 'start'}`;
  
  let avatar;
  if (role === 'user') {
    avatar = `
      <div class="chat-image avatar">
        <div class="w-10 rounded-full bg-[#f83c89] text-white grid place-items-center">
          <i class="bi bi-person text-lg"></i>
        </div>
      </div>
    `;
  } else {
    avatar = `
      <div class="chat-image avatar">
        <div class="w-10 rounded-full bg-[#7cc0e4] text-white grid place-items-center">
          <i class="bi bi-robot text-lg"></i>
        </div>
      </div>
    `;
  }
  
  messageDiv.innerHTML = `
    ${avatar}
    <div class="chat-bubble ${role === 'user' ? 'bg-[#f83c89]' : 'bg-[#7cc0e4]'} text-white">
      ${marked.parse(message)}
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderBlueprints(blueprints) {
  const container = document.getElementById('blueprints-container');
  container.innerHTML = '';

  if (!blueprints || blueprints.length === 0) {
    container.innerHTML = `
      <div class="text-center p-8">
        <p class="text-[#464655] mb-4">You don't have any saved blueprints yet.</p>
        <button id="create-first-blueprint" class="btn bg-[#f83c89] hover:bg-[#e0357a] border-none text-white">
          <i class="bi bi-clipboard2-plus-fill mr-2"></i> Create Your First Blueprint
        </button>
      </div>
    `;
    
    document.getElementById('create-first-blueprint').addEventListener('click', () => {
      profileSection.style.display = 'none';
      blueprintSection.style.display = 'block';
      chatSection.style.display = 'block';
      blueprintFormModal.classList.add('modal-open');
    });
    
    return;
  }

  blueprints.forEach(blueprint => {
    const card = document.createElement('div');
    card.className = 'blueprint-card';
    card.innerHTML = `
      <div class="card-body">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-gray-500">${new Date(blueprint.createdAt?.seconds * 1000).toLocaleDateString()}</span>
          <div class="blueprint-tag" data-id="${blueprint.id}" onclick="editBlueprintTag('${blueprint.id}', this)">
            ${blueprint.tag || 'Add tag'}
          </div>
        </div>
        <div class="blueprint-content">
          ${marked.parse(blueprint.content)}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Make editBlueprintTag available globally
window.editBlueprintTag = async function(blueprintId, tagElement) {
  const currentTag = tagElement.textContent.trim();
  const newTag = prompt('Enter a tag for this blueprint:', currentTag === 'Add tag' ? '' : currentTag);
  
  if (newTag !== null) {
    try {
      await blueprintService.updateBlueprintTag(blueprintId, newTag);
      tagElement.textContent = newTag || 'Add tag';
      showToast('Tag updated successfully!');
    } catch (error) {
      console.error('Error updating tag:', error);
      showToast('Failed to update tag', 'error');
    }
  }
};

// Edit Profile button click
document.getElementById('edit-profile').addEventListener('click', () => {
  if (currentUser) {
    // Pre-fill the form with current user data
    document.querySelector('#edit-profile-form [name="displayName"]').value = currentUser.displayName || '';
    document.querySelector('#edit-profile-form [name="bio"]').value = currentUser.bio || '';
    
    // Open the modal
    document.getElementById('edit-profile-modal').classList.add('modal-open');
  }
});

// Edit Profile form submission
document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const displayName = e.target.displayName.value;
  const bio = e.target.bio.value;
  
  try {
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
    
    // Update user profile
    await authService.updateUserProfile(currentUser, {
      displayName,
      bio
    });
    
    // Update the UI
    document.getElementById('profile-name').textContent = displayName;
    document.getElementById('profile-bio').textContent = bio;
    
    // Close the modal
    document.getElementById('edit-profile-modal').classList.remove('modal-open');
    
    showToast('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    showToast('Failed to update profile: ' + (error.message || ''), 'error');
  } finally {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
}); 