import * as cheerio from 'cheerio';

/**
 * Form Analysis Service
 *
 * Intelligently analyzes HTML forms to determine their purpose, fields, and integration.
 * Critical for preserving contact forms, newsletter signups, search functionality.
 */

export type FormPurpose = 'contact' | 'newsletter' | 'search' | 'booking' | 'login' | 'comment' | 'filter' | 'payment' | 'unknown';
export type ButtonStyle = 'primary' | 'secondary' | 'ghost' | 'link' | 'unknown';

export interface FormField {
    name?: string;
    type: string;              // email, tel, text, textarea, select, etc.
    label?: string;
    placeholder?: string;
    required: boolean;
    validation?: string;       // pattern attribute
    options?: string[];        // for select/radio
}

export interface FormAnalysis {
    formId?: string;
    action?: string;              // Submit URL
    method?: string;              // POST/GET
    purpose: FormPurpose;
    purposeConfidence: number;    // 0-100
    fields: FormField[];
    submitButton?: {
        text: string;
        classes: string[];
        style: ButtonStyle;
    };
    hasHoneypot: boolean;         // Spam protection detected
    hasRecaptcha: boolean;        // reCAPTCHA detected
    integrations: string[];       // Mailchimp, Hubspot, ActiveCampaign, etc.
    context?: string;             // Surrounding text for better understanding
}

export class FormAnalyzer {
    /**
     * Analyzes all forms on a page and returns detailed information
     */
    static analyzeForms($: cheerio.CheerioAPI): FormAnalysis[] {
        const forms: FormAnalysis[] = [];

        $('form').each((_, formEl) => {
            const $form = $(formEl);

            // Basic form attributes
            const formId = $form.attr('id');
            const action = $form.attr('action');
            const method = ($form.attr('method') || 'GET').toUpperCase();

            // Extract fields
            const fields = this.extractFields($, $form);

            // Detect purpose based on fields, action, and context
            const { purpose, confidence } = this.detectPurpose($, $form, fields, action);

            // Extract submit button
            const submitButton = this.extractSubmitButton($, $form);

            // Detect integrations and security
            const hasHoneypot = this.detectHoneypot($, $form);
            const hasRecaptcha = this.detectRecaptcha($, $form);
            const integrations = this.detectIntegrations($, $form, action);

            // Extract context (surrounding text)
            const context = this.extractContext($, $form);

            forms.push({
                formId,
                action,
                method,
                purpose,
                purposeConfidence: confidence,
                fields,
                submitButton,
                hasHoneypot,
                hasRecaptcha,
                integrations,
                context
            });
        });

        return forms;
    }

    /**
     * Extracts all fields from a form
     */
    private static extractFields($: cheerio.CheerioAPI, $form: cheerio.Cheerio<any>): FormField[] {
        const fields: FormField[] = [];

        // Input fields
        $form.find('input, textarea, select').each((_, fieldEl) => {
            const $field = $(fieldEl);
            const name = $field.attr('name');
            const type = $field.attr('type') || ($field.is('textarea') ? 'textarea' : ($field.is('select') ? 'select' : 'text'));

            // Skip hidden fields and submit buttons
            if (type === 'hidden' || type === 'submit' || type === 'button') {
                return;
            }

            // Find label
            const id = $field.attr('id');
            let label: string | undefined;
            if (id) {
                label = $(`label[for="${id}"]`).text().trim();
            }
            if (!label) {
                label = $field.attr('aria-label') || $field.attr('placeholder');
            }
            if (!label) {
                // Check for parent label
                const parentLabel = $field.closest('label').text().trim();
                if (parentLabel) label = parentLabel;
            }

            const placeholder = $field.attr('placeholder');
            const required = $field.attr('required') !== undefined || $field.attr('aria-required') === 'true';
            const validation = $field.attr('pattern');

            // Extract options for select/radio
            let options: string[] | undefined;
            if (type === 'select') {
                options = [];
                $field.find('option').each((_, opt) => {
                    const optText = $(opt).text().trim();
                    if (optText) options!.push(optText);
                });
            }

            fields.push({
                name,
                type,
                label,
                placeholder,
                required,
                validation,
                options
            });
        });

        return fields;
    }

    /**
     * Detects the purpose of a form based on fields, action, and context
     */
    private static detectPurpose(
        $: cheerio.CheerioAPI,
        $form: cheerio.Cheerio<any>,
        fields: FormField[],
        action?: string
    ): { purpose: FormPurpose; confidence: number } {
        let scores: Record<FormPurpose, number> = {
            contact: 0,
            newsletter: 0,
            search: 0,
            booking: 0,
            login: 0,
            comment: 0,
            filter: 0,
            payment: 0,
            unknown: 0
        };

        // Analyze field types and names
        fields.forEach(field => {
            const fieldName = (field.name || '').toLowerCase();
            const fieldLabel = (field.label || '').toLowerCase();
            const fieldPlaceholder = (field.placeholder || '').toLowerCase();
            const combined = `${fieldName} ${fieldLabel} ${fieldPlaceholder}`;

            // Newsletter signals
            if (field.type === 'email' && fields.length <= 2) {
                scores.newsletter += 40;
            }
            if (combined.includes('newsletter') || combined.includes('subscribe')) {
                scores.newsletter += 30;
            }

            // Contact form signals
            if (combined.includes('message') || combined.includes('nachricht')) {
                scores.contact += 40;
            }
            if (field.type === 'textarea') {
                scores.contact += 20;
            }
            if (field.type === 'tel' || combined.includes('phone') || combined.includes('telefon')) {
                scores.contact += 25;
            }
            if ((combined.includes('name') || combined.includes('vorname')) && field.type === 'text') {
                scores.contact += 15;
                scores.booking += 10;
            }

            // Search signals
            if (combined.includes('search') || combined.includes('suche') || combined.includes('query')) {
                scores.search += 50;
            }
            if (field.type === 'search') {
                scores.search += 40;
            }

            // Login signals
            if (combined.includes('password') || combined.includes('passwort')) {
                scores.login += 50;
            }
            if (combined.includes('username') || combined.includes('benutzername')) {
                scores.login += 30;
            }
            if (combined.includes('remember') && field.type === 'checkbox') {
                scores.login += 20;
            }

            // Booking signals
            if (field.type === 'date' || combined.includes('date') || combined.includes('datum')) {
                scores.booking += 30;
            }
            if (combined.includes('booking') || combined.includes('reservation') || combined.includes('buchung')) {
                scores.booking += 40;
            }
            if (field.type === 'time' || combined.includes('time') || combined.includes('uhrzeit')) {
                scores.booking += 25;
            }

            // Comment signals
            if (combined.includes('comment') || combined.includes('kommentar')) {
                scores.comment += 40;
            }

            // Filter signals (product/search filters)
            if (field.type === 'checkbox' || field.type === 'radio') {
                scores.filter += 10;
            }
            if (combined.includes('filter') || combined.includes('category') || combined.includes('kategorie')) {
                scores.filter += 30;
            }

            // Payment signals
            if (combined.includes('card') || combined.includes('karte') || combined.includes('payment')) {
                scores.payment += 40;
            }
            if (combined.includes('cvv') || combined.includes('cvc')) {
                scores.payment += 50;
            }
        });

        // Analyze form action
        if (action) {
            const actionLower = action.toLowerCase();
            if (actionLower.includes('search')) scores.search += 30;
            if (actionLower.includes('contact')) scores.contact += 25;
            if (actionLower.includes('subscribe')) scores.newsletter += 25;
            if (actionLower.includes('login') || actionLower.includes('signin')) scores.login += 30;
            if (actionLower.includes('booking') || actionLower.includes('reservation')) scores.booking += 30;
            if (actionLower.includes('comment')) scores.comment += 25;
            if (actionLower.includes('checkout') || actionLower.includes('payment')) scores.payment += 30;
        }

        // Analyze form classes and IDs
        const formClasses = $form.attr('class') || '';
        const formId = $form.attr('id') || '';
        const combined = `${formClasses} ${formId}`.toLowerCase();

        if (combined.includes('newsletter')) scores.newsletter += 20;
        if (combined.includes('contact')) scores.contact += 20;
        if (combined.includes('search')) scores.search += 20;
        if (combined.includes('login')) scores.login += 20;
        if (combined.includes('booking')) scores.booking += 20;
        if (combined.includes('comment')) scores.comment += 20;
        if (combined.includes('filter')) scores.filter += 20;

        // Context analysis (heading/text near form)
        const nearbyText = $form.prev('h1, h2, h3, p').text().toLowerCase() +
                          $form.next('h1, h2, h3, p').text().toLowerCase();

        if (nearbyText.includes('kontakt') || nearbyText.includes('contact')) scores.contact += 15;
        if (nearbyText.includes('newsletter') || nearbyText.includes('subscribe')) scores.newsletter += 15;
        if (nearbyText.includes('suche') || nearbyText.includes('search')) scores.search += 15;
        if (nearbyText.includes('buchen') || nearbyText.includes('book') || nearbyText.includes('reserv')) scores.booking += 15;

        // Find highest score
        const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const [topPurpose, topScore] = sortedScores[0];

        // If score is too low, mark as unknown
        if (topScore < 20) {
            return { purpose: 'unknown', confidence: 0 };
        }

        // Calculate confidence (0-100)
        const confidence = Math.min(100, Math.round(topScore));

        return { purpose: topPurpose as FormPurpose, confidence };
    }

    /**
     * Extracts submit button information
     */
    private static extractSubmitButton($: cheerio.CheerioAPI, $form: cheerio.Cheerio<any>): { text: string; classes: string[]; style: ButtonStyle } | undefined {
        const $button = $form.find('button[type="submit"], input[type="submit"], button:not([type])').first();

        if ($button.length === 0) return undefined;

        const text = $button.text().trim() || $button.attr('value') || 'Submit';
        const classes = ($button.attr('class') || '').split(' ').filter(Boolean);

        // Detect button style
        let style: ButtonStyle = 'unknown';
        const classStr = classes.join(' ').toLowerCase();

        if (classStr.includes('primary') || classStr.includes('btn-primary')) {
            style = 'primary';
        } else if (classStr.includes('secondary') || classStr.includes('btn-secondary')) {
            style = 'secondary';
        } else if (classStr.includes('ghost') || classStr.includes('outline')) {
            style = 'ghost';
        } else if (classStr.includes('link') || classStr.includes('btn-link')) {
            style = 'link';
        } else if (classes.length > 0) {
            // If it has a btn class, assume primary
            if (classStr.includes('btn')) {
                style = 'primary';
            }
        }

        return { text, classes, style };
    }

    /**
     * Detects honeypot fields (hidden spam protection)
     */
    private static detectHoneypot($: cheerio.CheerioAPI, $form: cheerio.Cheerio<any>): boolean {
        // Look for hidden fields with suspicious names
        const suspiciousNames = ['honeypot', 'website', 'url', 'email_confirm', 'phone_2'];

        let found = false;
        $form.find('input[type="hidden"], input[type="text"]').each((_, field) => {
            const $field = $(field);
            const name = ($field.attr('name') || '').toLowerCase();
            const style = $field.attr('style') || '';

            // Check if hidden via CSS
            const isHidden = style.includes('display: none') ||
                           style.includes('display:none') ||
                           style.includes('visibility: hidden') ||
                           $field.hasClass('hidden') ||
                           $field.hasClass('d-none');

            if (isHidden && suspiciousNames.some(sus => name.includes(sus))) {
                found = true;
                return false; // break
            }
        });

        return found;
    }

    /**
     * Detects reCAPTCHA integration
     */
    private static detectRecaptcha($: cheerio.CheerioAPI, $form: cheerio.Cheerio<any>): boolean {
        // Check for reCAPTCHA div
        if ($form.find('.g-recaptcha').length > 0) return true;

        // Check for invisible reCAPTCHA
        if ($form.find('[data-sitekey]').length > 0) return true;

        // Check for hCaptcha
        if ($form.find('.h-captcha').length > 0) return true;

        return false;
    }

    /**
     * Detects third-party integrations (Mailchimp, Hubspot, etc.)
     */
    private static detectIntegrations($: cheerio.CheerioAPI, $form: cheerio.Cheerio<any>, action?: string): string[] {
        const integrations: string[] = [];

        // Check action URL for integrations
        if (action) {
            const actionLower = action.toLowerCase();
            if (actionLower.includes('mailchimp')) integrations.push('Mailchimp');
            if (actionLower.includes('hubspot')) integrations.push('Hubspot');
            if (actionLower.includes('activecampaign')) integrations.push('ActiveCampaign');
            if (actionLower.includes('sendinblue') || actionLower.includes('brevo')) integrations.push('Brevo');
            if (actionLower.includes('klaviyo')) integrations.push('Klaviyo');
            if (actionLower.includes('convertkit')) integrations.push('ConvertKit');
            if (actionLower.includes('getresponse')) integrations.push('GetResponse');
        }

        // Check for hidden fields with integration signatures
        $form.find('input[type="hidden"]').each((_, field) => {
            const name = ($(field).attr('name') || '').toLowerCase();
            const value = ($(field).attr('value') || '').toLowerCase();

            if (name.includes('mailchimp') || value.includes('mailchimp')) {
                if (!integrations.includes('Mailchimp')) integrations.push('Mailchimp');
            }
            if (name.includes('hubspot') || value.includes('hubspot')) {
                if (!integrations.includes('Hubspot')) integrations.push('Hubspot');
            }
        });

        // Check form classes/IDs
        const formClasses = $form.attr('class') || '';
        const formId = $form.attr('id') || '';
        const combined = `${formClasses} ${formId}`.toLowerCase();

        if (combined.includes('mailchimp') && !integrations.includes('Mailchimp')) {
            integrations.push('Mailchimp');
        }
        if (combined.includes('hubspot') && !integrations.includes('Hubspot')) {
            integrations.push('Hubspot');
        }

        return integrations;
    }

    /**
     * Extracts context text around the form (heading, description)
     */
    private static extractContext($: cheerio.CheerioAPI, $form: cheerio.Cheerio<any>): string {
        // Get previous heading
        const prevHeading = $form.prevAll('h1, h2, h3').first().text().trim();

        // Get previous paragraph
        const prevParagraph = $form.prevAll('p').first().text().trim();

        // Get parent section heading
        const parentHeading = $form.closest('section, div').find('h1, h2, h3').first().text().trim();

        // Combine (max 200 chars)
        const context = [prevHeading, parentHeading, prevParagraph]
            .filter(Boolean)
            .join(' | ')
            .slice(0, 200);

        return context || '';
    }

    /**
     * Generates a summary report for forms
     */
    static generateFormReport(forms: FormAnalysis[]): string {
        if (forms.length === 0) return 'No forms found on this page.';

        let report = `Found ${forms.length} form(s):\n\n`;

        forms.forEach((form, idx) => {
            report += `Form ${idx + 1}:\n`;
            report += `  Purpose: ${form.purpose} (${form.purposeConfidence}% confidence)\n`;
            report += `  Fields: ${form.fields.length}\n`;
            if (form.submitButton) {
                report += `  Submit: "${form.submitButton.text}" (${form.submitButton.style})\n`;
            }
            if (form.integrations.length > 0) {
                report += `  Integrations: ${form.integrations.join(', ')}\n`;
            }
            if (form.hasRecaptcha) {
                report += `  Security: reCAPTCHA enabled\n`;
            }
            report += `\n`;
        });

        return report;
    }
}
