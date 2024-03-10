import api from "./api";
import router from '../router';
import moment from 'moment';

let edition = 'Standard';

export default {
    getSelectOptions: async function(option) {
        let options = [];
        
        if (Array.isArray(option)) {
            option.forEach(function (item) {
                options.push({
                    title: item,
                    value: item
                });
            });
        } else if (option) {
            if (typeof option === 'string') {
                const result = await api.get('?cmd=options&table=' + option);
                option = result.data.options;
            }

            for (const [key, value] of Object.entries(option)) {
                options.push({
                    title: value,
                    value: key
                });
            }
        }

        options.sort((a, b) => a.title.localeCompare(b.title));

        return options;
    },
    getOptions: async function (column, type, optionConfig, data) {
        let options = {};

        // get options
        if (['select', 'select_parent', 'select_multiple'].includes(type)) {
            let option = optionConfig[column.replaceAll('_', ' ')];
            options = await this.getSelectOptions(option);

            // prepend selected value
            if (type === 'select_multiple' && Array.isArray(data)) {
                data.reverse().forEach((item) => {
                    // check if already exists
                    if (!options.some(option => option.value === item)) {
                        options.unshift({
                            value: item,
                            title: item,
                        });
                    }
                });
            }

            return options;
        } else if (type === 'combo') {
            return [];
        }
    },
    getAllOptions: async function (fields, optionConfig, data) {
        let options = {};

        for (const [, field] of Object.entries(fields)) {
            options[field.column] = await this.getOptions(field.column, field.type, optionConfig, data);
        }

        return options;
    },
    base: function () {
        let base = '/';
        if (router.router.currentRoute.value.params.base) {
            base += router.router.currentRoute.value.params.base + '/';
        }

        return base;
    },
    formatDate: function(value) {
        if (value) {
            return moment(value).format('DD-MMM-YYYY')
        }
    },
    formatDateTime: function(value) {
        if (value) {
            return moment(value).format('DD-MMM-YYYY HH:mm')
        }
    },
    formatData: function(value, fieldType) {
        switch(fieldType) {
            case 'password':
                return '';
            case 'date':
                return this.formatDate(value);
            case 'datetime':
            case 'timestamp':
                return this.formatDateTime(value);
        }

        return value;
    },
    formatString: function (str) {
        str = str.replace(/_/g, ' ');
        return str.charAt(0).toUpperCase() + str.slice(1)
    },
    setEdition: function (value) {
        edition = value;
    },
    getEdition: function () {
        return edition;
    },
}