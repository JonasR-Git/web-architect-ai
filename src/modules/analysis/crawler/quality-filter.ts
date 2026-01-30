
import { Page, HTTPResponse } from 'puppeteer';

export interface QualityCheckResult {
    passed: boolean;
    reason?: string;
    statusCode?: number;
    isSoft404?: boolean;
}

/**
 * Checks if a page meets quality standards.
 * 1. Status Code Validation (404, 500 etc.)
 * 2. Soft 404 Detection (Title/H1 analysis)
 */
export async function checkPageQuality(page: Page, response: HTTPResponse | null): Promise<QualityCheckResult> {

    // --- 1. Status Code Check ---
    if (response) {
        const status = response.status();
        if (status === 404 || status === 410) {
            return { passed: false, reason: `Status Code ${status}`, statusCode: status };
        }
        if (status >= 500) {
            return { passed: false, reason: `Server Error ${status}`, statusCode: status };
        }
        // We generally accept 403 (Forbidden) if content is visible, but often it's a block.
        // For now, let's treat 403 as a soft-fail (warn but maybe allow if content exists?). 
        // User requested strictly filtering "Garbage", so 403 usually yields no structure.
        if (status === 403) {
            return { passed: false, reason: `Access Forbidden ${status}`, statusCode: status };
        }
    }

    // --- 2. Soft 404 Detection ---
    // Sometimes servers return 200 OK but with "Page Not Found" content.
    try {
        const soft404Signals = await page.evaluate(() => {
            const title = document.title.toLowerCase();
            const h1 = document.querySelector('h1')?.innerText.toLowerCase() || '';
            const bodyText = document.body.innerText.substring(0, 500).toLowerCase(); // Check start of body

            const errorKeywords = [
                'page not found',
                '404 not found',
                'error 404',
                'seite nicht gefunden',
                'empfangsprobleme', // Specific joke/custom error
                'nothing found',
                'not found',
                'content unavailable',
                'access denied'
            ];

            // Strong Signal: Title contains explicit error
            if (errorKeywords.some(kw => title.includes(kw))) return { match: 'title', value: title };

            // Strong Signal: H1 contains explicit error
            if (errorKeywords.some(kw => h1.includes(kw))) return { match: 'h1', value: h1 };

            return null;
        });

        if (soft404Signals) {
            return {
                passed: false,
                reason: `Soft 404 detected in ${soft404Signals.match}: "${soft404Signals.value}"`,
                isSoft404: true
            };
        }

    } catch (e) {
        // Evaluation failed, assume safe or log warning
        console.warn('Soft 404 check failed:', e);
    }

    return { passed: true };
}
