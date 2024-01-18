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
        } else {
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

        return options;
    },
}