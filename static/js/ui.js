import * as elements from './elements.js';

/**
 * Displays a message to the user.
 * @param {string} message - The message to display.
 * @param {boolean} isSuccess - Determines the message color (true for green, false for red).
 */
export const showMessage = (message, isSuccess) => {
    console.log(`Showing message: "${message}", Success: ${isSuccess}`);
    elements.messageBox.textContent = message;
    elements.messageBox.classList.remove('bg-green-500', 'bg-red-500');
    elements.messageBox.classList.add(isSuccess ? 'bg-green-500' : 'bg-red-500');

    elements.messageBox.classList.remove('opacity-0', 'translate-y-10');
    elements.messageBox.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        elements.messageBox.classList.remove('opacity-100', 'translate-y-0');
        elements.messageBox.classList.add('opacity-0', 'translate-y-10');
    }, 3000);
};

/**
 * Creates an SVG helmet icon.
 * @param {string} color - The fill color of the helmet.
 * @param {string} [sizeClass='w-8 h-8'] - The Tailwind CSS size class.
 * @returns {SVGSVGElement} The SVG element for the helmet.
 */
export const createHelmetIcon = (color, sizeClass = 'w-8 h-8') => {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('class', sizeClass);
    svg.setAttribute('viewBox', '0 0 50 50');

    const helmetPath = document.createElementNS(svgNS, 'path');
    helmetPath.setAttribute('d', 'M25,5 C10,5 5,20 5,30 C5,45 15,45 25,45 C35,45 45,45 45,30 C45,20 40,5 25,5 Z');
    helmetPath.setAttribute('fill', color);
    helmetPath.setAttribute('stroke', '#4A5568');
    helmetPath.setAttribute('stroke-width', '2');

    const visor = document.createElementNS(svgNS, 'rect');
    visor.setAttribute('x', '15');
    visor.setAttribute('y', '20');
    visor.setAttribute('width', '20');
    visor.setAttribute('height', '10');
    visor.setAttribute('fill', '#2D3748');
    visor.setAttribute('rx', '2');

    svg.appendChild(helmetPath);
    svg.appendChild(visor);

    return svg;
};

/**
 * Shows a generic confirmation modal.
 * @param {string} message - The confirmation message to display.
 * @param {function} onConfirm - The callback function to execute if the user confirms.
 */
export const showConfirmationModal = (message, onConfirm) => {
    console.log(`Showing confirmation modal with message: "${message}"`);
    elements.confirmationModalText.textContent = message;
    elements.confirmationModal.classList.remove('hidden');

    const confirmHandler = () => {
        console.log("Confirmation accepted.");
        onConfirm();
        hideConfirmationModal();
    };

    const cancelHandler = () => {
        console.log("Confirmation canceled.");
        hideConfirmationModal();
    };

    const hideConfirmationModal = () => {
        elements.confirmationModal.classList.add('hidden');
        elements.confirmationModalConfirmBtn.removeEventListener('click', confirmHandler);
        elements.confirmationModalCancelBtn.removeEventListener('click', cancelHandler);
    };

    elements.confirmationModalConfirmBtn.addEventListener('click', confirmHandler);
    elements.confirmationModalCancelBtn.addEventListener('click', cancelHandler);
};