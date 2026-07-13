/**
 * ===============================================
 * NEXORA ADMIN PANEL
 * Shared Components Loader
 * ===============================================
 */

document.addEventListener("DOMContentLoaded", () => {

    loadComponent("sidebar", "../components/sidebar.html");

    loadComponent("navbar", "../components/navbar.html");

    loadComponent("footer", "../components/footer.html");

    loadComponent("loader", "../components/loader.html");

});

/**
 * Load HTML Components
 */

async function loadComponent(id, file){

    const element = document.getElementById(id);

    if(!element) return;

    try{

        const response = await fetch(file);

        if(!response.ok){

            throw new Error(`Unable to load ${file}`);

        }

        element.innerHTML = await response.text();

        // Log successful load and dispatch events so other scripts can react
        console.log(`components.js: Loaded component '${id}' from '${file}'`);

        const successEvent = new CustomEvent('componentLoaded', { detail: { id, file } });

        // Dispatch on the element and document for flexible listening
        try { element.dispatchEvent(successEvent); } catch (e) {}
        try { document.dispatchEvent(successEvent); } catch (e) {}

    }

    catch(error){

        console.error(error);

        const failEvent = new CustomEvent('componentLoadFailed', { detail: { id, file, error: String(error) } });

        try { element.dispatchEvent(failEvent); } catch (e) {}
        try { document.dispatchEvent(failEvent); } catch (e) {}

    }

}
