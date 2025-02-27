import './style.css';
import { auth } from './firebase';
import { authService } from './services/auth';
import { blueprintService } from './services/blueprint';
import { marked } from 'marked';

// State management
let currentUser = null;
let currentBlueprint = null;
let isProcessing = false;

// DOM Elements
const loginButton = document.getElementById('login-button');
const profileButton = document.getElementById('profile-button');
const authModal = document.getElementById('auth-modal');
const profileSection = document.getElementById('profile-section');
const blueprintSection = document.getElementById('blueprint-section');
const getBlueprintButton = document.getElementById('get-blueprint-button');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendMessageButton = document.getElementById('send-message');
const loadingIndicator = document.getElementById('loading-indicator');
const blueprintFormModal = document.getElementById('blueprint-form-modal');
const blueprintResultModal = document.getElementById('blueprint-result-modal');
const blueprintForm = document.getElementById('blueprint-form');
const saveBlueprintButton = document.getElementById('save-blueprint');

// Auth state observer
auth.onAuthStateChanged((user) => {
  currentUser = user;
  updateUI();
});

// UI update function
function updateUI() {
  const isLoggedIn = !!currentUser;
  
  // Update navigation
  loginButton.textContent = isLoggedIn ? 'Sign Out' : 'Sign In';
  profileButton.style.display = isLoggedIn ? 'block' : 'none';
  
  // Update sections visibility
  profileSection.style.display = 'none';
  blueprintSection.style.display = 'block';
}

// Event Listeners
loginButton.addEventListener('click', async () => {
  if (currentUser) {
    await authService.signOut();
  } else {
    authModal.classList.add('modal-open');
  }
});

document.getElementById('google-signin').addEventListener('click', async () => {
  try {
    await authService.signInWithGoogle();
    authModal.classList.remove('modal-open');
  } catch (error) {
    console.error('Google sign in error:', error);
    alert('Failed to sign in with Google');
  }
});

document.getElementById('twitter-signin').addEventListener('click', async () => {
  try {
    await authService.signInWithTwitter();
    authModal.classList.remove('modal-open');
  } catch (error) {
    console.error('Twitter sign in error:', error);
    alert('Failed to sign in with Twitter');
  }
});

document.getElementById('metamask-signin').addEventListener('click', async () => {
  try {
    await authService.signInWithMetamask();
    authModal.classList.remove('modal-open');
  } catch (error) {
    console.error('Metamask sign in error:', error);
    alert('Failed to sign in with Metamask');
  }
});

document.getElementById('email-signin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;
  
  try {
    await authService.signInWithEmail(email, password);
    authModal.classList.remove('modal-open');
  } catch (error) {
    console.error('Email sign in error:', error);
    alert('Failed to sign in with email');
  }
});

profileButton.addEventListener('click', async () => {
  profileSection.style.display = 'block';
  blueprintSection.style.display = 'none';
  
  if (currentUser) {
    const blueprints = await blueprintService.getUserBlueprints(currentUser.uid);
    renderBlueprints(blueprints);
  }
});

getBlueprintButton.addEventListener('click', () => {
  blueprintFormModal.classList.add('modal-open');
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
    alert('Failed to generate blueprint');
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
    
    alert('Blueprint saved successfully!');
    blueprintResultModal.classList.remove('modal-open');
  } catch (error) {
    console.error('Error saving blueprint:', error);
    alert('Failed to save blueprint');
  } finally {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
});

// Chat functionality
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
  
  const html = `
    <div class="chat-image avatar">
      <div class="w-10 rounded-full ${role === 'user' ? 'bg-secondary' : 'bg-primary'} text-${role === 'user' ? 'secondary' : 'primary'}-content grid place-items-center">
        <i class="bi bi-${role === 'user' ? 'person' : 'robot'} text-lg"></i>
      </div>
    </div>
    <div class="chat-bubble">${marked.parse(message)}</div>
  `;
  
  messageDiv.innerHTML = html;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add event listeners for chat
sendMessageButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Helper function to render blueprints in profile
function renderBlueprints(blueprints) {
  const blueprintsContainer = document.getElementById('blueprints-container');
  blueprintsContainer.innerHTML = '';
  
  blueprints.forEach(blueprint => {
    const card = document.createElement('div');
    card.className = 'blueprint-card';
    
    const content = document.createElement('div');
    content.className = 'blueprint-content';
    content.innerHTML = marked.parse(blueprint.content);
    
    const tag = document.createElement('span');
    tag.className = 'blueprint-tag';
    tag.textContent = blueprint.tag || 'Add tag';
    tag.onclick = () => editBlueprintTag(blueprint.id, tag);
    
    card.appendChild(content);
    card.appendChild(tag);
    blueprintsContainer.appendChild(card);
  });
}

// Helper function to edit blueprint tags
async function editBlueprintTag(blueprintId, tagElement) {
  const currentTag = tagElement.textContent;
  const input = document.createElement('input');
  input.className = 'edit-tag-input';
  input.value = currentTag === 'Add tag' ? '' : currentTag;
  
  tagElement.replaceWith(input);
  input.focus();
  
  input.onblur = async () => {
    try {
      await blueprintService.updateBlueprintTag(blueprintId, input.value);
      tagElement.textContent = input.value || 'Add tag';
      input.replaceWith(tagElement);
    } catch (error) {
      console.error('Error updating tag:', error);
      input.replaceWith(tagElement);
    }
  };
  
  input.onkeypress = (e) => {
    if (e.key === 'Enter') {
      input.blur();
    }
  };
} 