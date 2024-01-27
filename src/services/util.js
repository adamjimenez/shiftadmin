import api from "./api";

export default {
    getOptions: async function(option) {
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
    getAllOptions: async function (fields, vars, section, data) {
        let options = {};

        for (const [, field] of Object.entries(fields)) {

            // get options
            if (['select', 'select_parent', 'select_multiple'].includes(field.type)) {
                let option = (field.type === 'select_parent') ? section : vars.options[field.column.replaceAll(' ', '_')];
                options[field.column] = await this.getOptions(option);

                // prepend selected value
                if (field.type === 'select_multiple' && Array.isArray(data[field.column])) {
                    data[field.column].reverse().forEach((item) => {
                        // check if already exists
                        if (!options[field.column].some(option => option.value === item)) {
                            options[field.column].unshift({
                                value: item,
                                title: item,
                            });
                        }
                    });
                }
            } else if (field.type === 'combo') {
                options[field.column] = [];
            }
        }

        return options;
    }
}