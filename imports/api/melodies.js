import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import { Compositions } from './compositions.js';

export const Melodies = new Mongo.Collection('melodies');

/* Define how many melodies to publish/generate */
const LIM = 30, SUB_LIM = 10, COMP_NUM = 3;

/* Generate a random integer between [min, max) */
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return parseInt(Math.floor(Math.random() * (max - min)) + min);
}

// Publish the melodies in random way
if (Meteor.isServer) {
	Meteor.publish('melodies', function () {
		// Publish random LIM melodies
		return Melodies.find({}, {
			skip: getRandomInt(1, 10),
			limit: SUB_LIM
		});
	});
}

/* Try to get COMP_NUM compositions */
function getComps(compositions, index) {
	let ans = [];
	for (let i = 0; index < compositions.length && i < COMP_NUM; ++i, ++index) {
		ans.push(compositions[index]);
	}
	return ans;
}

Meteor.methods({

	/* Generate SUB_LIM random melodies */
	'melodies.loadMore'() {
		// Current indices for each composition type
		let rndComp = 0, popComp = 0;

		// Query compositions for random melodies
		rndCompsArr = Compositions.find({}, {
			skip: getRandomInt(1, 10),
			limit: SUB_LIM
		}).fetch();

		// Query compositions for popular melodies
		popCompsArr = Compositions.find({}, {
			skip: getRandomInt(1, 10),
			limit: SUB_LIM
		}).fetch();

		// Generate the melodies
		for (let i = 0; i < SUB_LIM; ++i) {
			// Define the type of melody randomly
			let melodyType = getRandomInt(1, 4);

			// Insert an empty melody if is AI type
			if (melodyType === 3) {
				Melodies.insert({
					type: melodyType,
					ids: [],
					playStrings: []
				});
			} else {
				// Based on the melody type, get COMP_NUM compositions
				let compositions;
				if (melodyType === 1) {
					compositions = getComps(rndCompsArr, rndComp);
					rndComp += compositions.length;
				} else  {
					compositions = getComps(popCompsArr, popComp);
					popComp += compositions.length;
				}

				// Build the ids + playstrings arrays
				let ids = [], playStrings = [];
				for (let i = 0; i < compositions.length; ++i) {
					ids.push(compositions[i]._id);
					playStrings.push(compositions[i].playString);
				}

				// Ignore melody if there are not enough ids|playStrings
				if (ids.length === 0) {
					continue;
				}

				// Insert the melody in the db
				Melodies.insert({
					type: melodyType,
					ids: ids,
					playStrings: playStrings
				});
			}
		}
	}

});
