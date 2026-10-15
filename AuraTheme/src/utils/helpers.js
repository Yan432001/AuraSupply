import axios from 'axios';
import { APIConfig } from './apiconfig';

export const animateAddToCart = ({ triggerElement, productImage }) => {
    if (typeof window === 'undefined' || !triggerElement) {
        return;
    }

    const cartElement = document.querySelector('[data-cart-target="true"]');
    if (!cartElement) {
        return;
    }

    const sourceImage =
        triggerElement.closest('.ant-card')?.querySelector('[data-product-image="true"]') ||
        triggerElement.closest('.ant-modal')?.querySelector('[data-product-image="true"]');

    const sourceRect = (sourceImage || triggerElement).getBoundingClientRect();
    const cartRect = cartElement.getBoundingClientRect();

    const flyer = document.createElement('div');
    flyer.setAttribute('aria-hidden', 'true');
    flyer.style.position = 'fixed';
    flyer.style.left = `${sourceRect.left}px`;
    flyer.style.top = `${sourceRect.top}px`;
    flyer.style.width = `${Math.max(Math.min(sourceRect.width, 96), 56)}px`;
    flyer.style.height = `${Math.max(Math.min(sourceRect.height, 96), 56)}px`;
    flyer.style.borderRadius = '18px';
    flyer.style.pointerEvents = 'none';
    flyer.style.zIndex = '9999';
    flyer.style.background = productImage
        ? `center / cover no-repeat url("${productImage}")`
        : 'linear-gradient(135deg, #2f6fed 0%, #ff7a3d 100%)';
    flyer.style.boxShadow = '0 20px 42px rgba(47, 111, 237, 0.28)';
    flyer.style.border = '1px solid rgba(255,255,255,0.88)';
    flyer.style.transform = 'translate3d(0, 0, 0) scale(1)';
    flyer.style.opacity = '0.96';
    flyer.style.transition =
        'transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 700ms ease';

    document.body.appendChild(flyer);

    const targetX = cartRect.left + cartRect.width / 2 - (sourceRect.left + flyer.offsetWidth / 2);
    const targetY = cartRect.top + cartRect.height / 2 - (sourceRect.top + flyer.offsetHeight / 2);

    requestAnimationFrame(() => {
        flyer.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(0.2)`;
        flyer.style.opacity = '0.18';
    });

    if (typeof cartElement.animate === 'function') {
        setTimeout(() => {
            cartElement.animate(
                [
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.12)' },
                    { transform: 'scale(1)' },
                ],
                {
                    duration: 280,
                    easing: 'ease-out',
                }
            );
        }, 520);
    }

    window.setTimeout(() => {
        flyer.remove();
    }, 760);
};

export const request = async (url = '', method = 'GET', data = {}) => {
    return axios({
        url: APIConfig.baseURL + url,
        method: method,
        data: data,
        headers: APIConfig.headers,
    }).then((response) => {
        
        return response.data;
    }).catch((error) => {
        console.log("API Request Error:", error);
        // throw error;
        return false;
    });
};
