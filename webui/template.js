function templateManagement() {
    return {
        templates: [],
        showModal: false,
        currentTemplate: {
            id: '',
            name: '',
            url: '',
            navigation_goal: '',
            data_extraction_goal: '',
            advanced_settings: {}
        },

        async init() {
            await this.loadTemplates();
        },

        async loadTemplates() {
            const response = await this.sendJsonData("/templates", {});
            if (response.ok) {
                this.templates = response.templates;
            }
        },

        openNewTemplateModal() {
            this.currentTemplate = {
                id: '',
                name: '',
                url: '',
                navigation_goal: '',
                data_extraction_goal: '',
                advanced_settings: {}
            };
            this.showModal = true;
        },

        editTemplate(template) {
            this.currentTemplate = { ...template };
            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
        },

        async saveTemplate() {
            const response = await this.sendJsonData("/save_template", this.currentTemplate);
            if (response.ok) {
                await this.loadTemplates();
                this.closeModal();
            } else {
                alert("Error saving template: " + response.message);
            }
        },

        async deleteTemplate(templateId) {
            if (confirm("Are you sure you want to delete this template?")) {
                const response = await this.sendJsonData("/delete_template", { id: templateId });
                if (response.ok) {
                    await this.loadTemplates();
                } else {
                    alert("Error deleting template: " + response.message);
                }
            }
        },

        async sendJsonData(url, data) {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return await response.json();
        }
    }
}