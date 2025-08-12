let messageQueue = [];
let isMessageVisible = false;

/**
 * Processes the next message in the queue if the message box is not currently visible.
 */
const processMessageQueue = () => {
    if (isMessageVisible || messageQueue.length === 0) {
        return; // Don't show a new message if one is already visible or queue is empty
    }

    isMessageVisible = true;
    const { message, isSuccess } = messageQueue.shift(); // Get the next message
    const messageBox = document.getElementById('message-box');

    messageBox.textContent = message;
    messageBox.className = `fixed bottom-24 right-4 py-2 px-4 rounded-lg shadow-lg text-white z-50 ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`;

    // Make it visible
    messageBox.classList.remove('opacity-0', 'translate-y-10');

    // Set a timer to hide the message
    setTimeout(() => {
        messageBox.classList.add('opacity-0', 'translate-y-10');

        // Set another timer to process the next message after the fade-out transition completes
        setTimeout(() => {
            isMessageVisible = false;
            processMessageQueue();
        }, 1000); // This duration should match the CSS transition duration
    }, 1800); // How long the message stays visible before fading
};

/**
 * Adds a message to the queue to be displayed to the user.
 * @param {string} message - The message to display.
 * @param {boolean} isSuccess - Whether the message indicates success or failure.
 */
export const showMessage = (message, isSuccess) => {
    messageQueue.push({ message, isSuccess });
    processMessageQueue();
};

/**
 * Creates an SVG helmet icon.
 * @param {string} color - The hex color for the helmet.
 * @param {string} sizeClasses - Tailwind CSS classes for width and height.
 * @returns {SVGSVGElement} The SVG element.
 */
export const createHelmetIcon = (color, sizeClasses = 'w-8 h-8') => {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('viewBox', '0 0 50 50');
    svg.setAttribute('class', sizeClasses);

    const helmetPath = document.createElementNS(svgNS, "path");
    helmetPath.setAttribute('fill', color);
    helmetPath.setAttribute('d', 'M25,5 C10,5 5,20 5,30 C5,45 15,45 25,45 C35,45 45,45 45,30 C45,20 40,5 25,5 Z');

    const visorPath = document.createElementNS(svgNS, "path");
    visorPath.setAttribute('fill', '#374151'); // A dark gray color for the visor
    visorPath.setAttribute('d', 'M5 23 H45 V30 H5 Z'); // A simple rectangle for the visor

    svg.appendChild(helmetPath);
    svg.appendChild(visorPath);
    return svg;
};

/**
 * Creates a default SVG vehicle icon.
 * @param {string} sizeClasses - Tailwind CSS classes for width and height.
 * @returns {SVGSVGElement} The SVG element.
 */
export const createVehicleIcon = (sizeClasses = 'w-16 h-16') => {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', `${sizeClasses} text-gray-500`);
    svg.setAttribute('fill', 'currentColor');

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute('d', 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z');

    svg.appendChild(path);
    return svg;
};

/**
 * Shows a confirmation modal.
 * @param {string} text - The confirmation message.
 * @param {function} onConfirm - The callback to execute if confirmed.
 */
export const showConfirmationModal = (text, onConfirm) => {
    const modal = document.getElementById('confirmation-modal');
    const textElement = document.getElementById('confirmation-modal-text');
    const confirmBtn = document.getElementById('confirmation-modal-confirm-btn');
    const cancelBtn = document.getElementById('confirmation-modal-cancel-btn');

    textElement.textContent = text;
    console.log(`[UI] Confirmation modal shown with text: "${text}"`);

    const confirmHandler = () => {
        onConfirm();
        modal.classList.add('hidden');
        cleanup();
    };

    const cancelHandler = () => {
        modal.classList.add('hidden');
        cleanup();
    };

    const cleanup = () => {
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
    };

    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', cancelHandler);

    modal.classList.remove('hidden');
};
