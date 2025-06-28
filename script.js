document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotContainer = document.getElementById('chatbotContainer');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    // Audio Elements
    const sounds = {
        typing: createAudio('sounds/typing.mp3', 0.2),
        send: createAudio('sounds/send.wav', 0.4),
        receive: createAudio('sounds/receive.mp3', 0.4)
    };

    // Set volumes
    typingSound.volume = 0.2;
    sendSound.volume = 0.3;
    receiveSound.volume = 0.3;

    let lastKeyTime = 0;
    let typingTimeout;
    let keyPressCount = 0;

    userInput.addEventListener('keydown', (e) => {
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Space') {
            const now = Date.now();
            const timeSinceLastKey = now - lastKeyTime;
            lastKeyTime = now;

            // Clear any pending timeout
            clearTimeout(typingTimeout);

            // Play sound immediately for first key or fast typing
            if (timeSinceLastKey > 100 || keyPressCount === 0) {
                playTypingSound();
            }

            // Increase responsiveness with rapid typing
            keyPressCount++;
            if (keyPressCount > 3 && timeSinceLastKey < 100) {
                playTypingSound();
            }

            // Reset counter after pause
            typingTimeout = setTimeout(() => {
                keyPressCount = 0;
            }, 200);
        }
    });

    function playTypingSound() {
        try {
            typingSound.currentTime = 0;
            typingSound.play().catch(e => console.log('Typing sound blocked'));
        } catch (e) {
            console.log('Sound error:', e);
        }
    }

    // Conversation context tracking
    let conversationContext = {
        lastQuestion: null,
        lastAnswer: null,
        followUp: false,
        isFirstInteraction: true,
        isTyping: false
    };

    // Initialize chatbot state
    function initChatbot() {
        chatbotContainer.classList.remove('visible');
        chatbotToggle.style.display = 'flex';
        userInput.focus();
        preloadSounds();
    }

    function createAudio(src, volume) {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.preload = 'auto';
        return audio;
    }

    // Preload sounds
    function preloadSounds() {
        Object.values(sounds).forEach(sound => {
            sound.load().catch(e => console.log('Sound preload error:', e));
        });
    }

    // Haptic feedback
    function triggerHapticFeedback(duration = 10) {
        if (navigator.vibrate) {
            try {
                navigator.vibrate(duration);
            } catch (e) {
                console.log('Vibration error:', e);
            }
        }
    }

    // Play sound with error handling
    function playSound(type) {
        const sound = sounds[type];
        if (!sound) return;

        try {
            sound.currentTime = 0;
            sound.play().catch(e => {
                console.log('Sound blocked:', e);
                // Fallback: Show message if sounds are blocked
                if (e.name === 'NotAllowedError') {
                    console.log('Please enable audio to hear sound effects');
                }
            });
        } catch (e) {
            console.log('Sound error:', e);
        }
    }

    // Toggle chat visibility
    function toggleChatVisibility() {
        if (chatbotContainer.classList.contains('visible')) {
            chatbotContainer.classList.remove('visible');
        } else {
            chatbotContainer.classList.add('visible');
            if (conversationContext.isFirstInteraction) {
                showWelcomeMessage();
                conversationContext.isFirstInteraction = false;
            }
        }
        triggerHapticFeedback();
    }

    // Show welcome message
    function showWelcomeMessage() {
        setTimeout(() => {
            addBotMessage("Hello! I'm your university assistant. How can I help you today? 😊");
        }, 500);
    }

    // Send message handler
    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            // User feedback with sound
            triggerHapticFeedback(15);
            playSound('send');
            addUserMessage(message);
            userInput.value = '';

            // Show typing indicator
            const typingIndicator = addTypingIndicator();
            conversationContext.isTyping = true;

            determineContext(message);

            // Process the message with delay
            setTimeout(() => {
                removeTypingIndicator(typingIndicator);
                conversationContext.isTyping = false;
                playSound('receive'); // Play receive sound when bot responds
                processWithJsonBackend(message);
            }, 800 + Math.random() * 700);
        }
    }

    let lastTypingSoundTime = 0;
    userInput.addEventListener('input', () => {
        const now = Date.now();
        if (now - lastTypingSoundTime > 300 && userInput.value.length > 0) {
            playSound('typing');
            lastTypingSoundTime = now;
        }
    });

    // Determine conversation context
    function determineContext(message) {
        const lowerMessage = message.toLowerCase();
        const isShortMessage = message.split(' ').length < 4;

        conversationContext.followUp = (
            lowerMessage.includes('this') ||
            lowerMessage.includes('that') ||
            lowerMessage.includes('more') ||
            lowerMessage.includes('about') ||
            isShortMessage
        ) && conversationContext.lastAnswer;
    }

    // Add user message to chat
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'user-message');
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        scrollToBottom();

        // Update context
        if (!conversationContext.followUp) {
            conversationContext.lastQuestion = message;
        }
    }

    // Add bot message to chat
    function addBotMessage(message) {
        triggerHapticFeedback(10);
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'bot-message');
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        scrollToBottom();

        conversationContext.lastAnswer = message;
    }

    // Add typing indicator
    function addTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator');
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(indicator);
        scrollToBottom();
        return indicator;
    }

    // Remove typing indicator
    function removeTypingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    // Scroll to bottom of chat
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // User typing sounds
    userInput.addEventListener('input', () => {
        clearTimeout(conversationContext.typingTimeout);
        if (userInput.value.length > 0) {
            playSound(typingSound);
        }
        // Throttle typing sounds
        conversationContext.typingTimeout = setTimeout(() => {
            if (userInput.value.length > 0) {
                playSound(typingSound);
            }
        }, 300);
    });

    // JSON Backend Implementation
    async function processWithJsonBackend(message) {
        try {
            const response = await fetch('knowledge.json');
            const knowledgeBase = await response.json();
            const lowerMessage = message.toLowerCase();
            let answer = null;

            // Handle follow-up context first
            if (conversationContext.followUp) {
                if (lowerMessage.includes('thank')) {
                    answer = "You're very welcome! 😊 Let me know if you need anything else.";
                } else if (lowerMessage.includes('more') || lowerMessage.includes('detail')) {
                    answer = conversationContext.lastAnswer + "\n\nFor more detailed information, please visit our website or contact the relevant department.";
                } else if (lowerMessage.match(/(yes|yeah|yep|sure|ok)/)) {
                    answer = "Great! What specific information would you like about this?";
                }
            }

            // If not a follow-up or no follow-up answer found, proceed normally
            if (!answer) {
                // Check greetings and casual conversation
                if (['hi', 'hello', 'hey'].some(greeting => lowerMessage.includes(greeting))) {
                    answer = "Hello! 😊 How can I help you today?";
                } else if (lowerMessage.includes('how are you')) {
                    answer = "I'm doing great, thanks for asking! How can I assist you today?";
                } else if (lowerMessage.includes('thank')) {
                    answer = "You're very welcome! 😊";
                } else {
                    // Check knowledge base
                    for (const item of knowledgeBase) {
                        // Exact matches
                        if (item.questions.some(q => q.toLowerCase() === lowerMessage)) {
                            answer = item.answer;
                            break;
                        }
                        // Keyword matches
                        if (!answer && item.keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
                            answer = item.answer;
                            break;
                        }
                    }
                }
            }

            if (answer) {
                addBotMessage(answer);
            } else {
                addBotMessage("I'm not sure I understand. Could you please rephrase your question or ask about something else?");
            }
        } catch (error) {
            console.error('Error:', error);
            addBotMessage("Sorry, I'm having trouble accessing my knowledge right now. Please try again later.");
        }
    }

    // OpenAI Backend Implementation
    async function processWithOpenAIBackend(message) {
        try {
            let messages = [];

            // Build context-aware prompt
            if (conversationContext.followUp && conversationContext.lastQuestion) {
                messages = [
                    {
                        role: "system",
                        content: `You're a university assistant. The previous conversation:
                        User: ${conversationContext.lastQuestion}
                        You: ${conversationContext.lastAnswer}
                        Now respond to this follow-up: ${message}`
                    }
                ];
            } else {
                messages = [
                    {
                        role: "system",
                        content: "You're a helpful university assistant. Provide concise, accurate information. " +
                            "Be friendly and professional. If you don't know something, say so."
                    },
                    { role: "user", content: message }
                ];
            }

            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: messages })
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            addBotMessage(data.answer || "I couldn't generate a response for that question.");
        } catch (error) {
            console.error('Error:', error);
            addBotMessage("I'm having trouble connecting to the AI service. Please try again later.");
        }
    }

    // Event Listeners
    chatbotToggle.addEventListener('click', toggleChatVisibility);
    minimizeBtn.addEventListener('click', toggleChatVisibility);
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendMessage();
    });

    // Initialize
    initChatbot();
});
