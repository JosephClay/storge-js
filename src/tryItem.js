var serialize = function(value) {
    return JSON.stringify(value);
};

var deserialize = function(value) {
    return value === undefined || value === '' ? value : JSON.parse(value);
};

return {
    keys: function(storage) {
        try {
            return Object.keys(storage);
        } catch(e) {
            return [];
        }
    },

    key: function(storage, index, err) {
        try {
            return storage.key(index);
        } catch(e) {
            if (err) { err(e); }
        }
    },

    get: function(storage, genkey, err) {
        try {
            return deserialize(storage.getItem(genkey));
        } catch(e) {
            if (err) { err(e); }
        }
    },

    set: function(storage, genkey, value, err) {
        try {
            storage.setItem(genkey, serialize(value));
        } catch(e) {
            if (err) { err(e); }
        }
    },

    remove: function(storage, genkey, err) {
        try {
            return storage.removeItem(genkey);
        } catch(e) {
            if (err) { err(e); }
        }
    },
};