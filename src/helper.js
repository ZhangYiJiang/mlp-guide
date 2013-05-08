module.exports = {
	numberToWord: function  (n, capitalize) {
		var w = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

		if (!capitalize) {
			return w[n].toLowerCase();
		} else {
			return w[n];
		}
	},

	slugify: function  (name) {
		return name
			.replace(/[^a-z\s\-]/ig, '')
			.trim()
			.replace(/[\s\-]+/g, '-')
			.toLowerCase();
	}
};