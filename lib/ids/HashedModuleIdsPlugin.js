/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const validateOptions = require("schema-utils");
const schema = require("../../schemas/plugins/HashedModuleIdsPlugin.json");
const { compareModulesByIndexOrIdentifier } = require("../util/comparators");
const createHash = require("../util/createHash");

class HashedModuleIdsPlugin {
	constructor(options) {
		validateOptions(schema, options || {}, "Hashed Module Ids Plugin");

		this.options = Object.assign(
			{
				context: null,
				hashFunction: "md4",
				hashDigest: "base64",
				hashDigestLength: 4
			},
			options
		);
	}

	apply(compiler) {
		const options = this.options;
		compiler.hooks.compilation.tap("HashedModuleIdsPlugin", compilation => {
			const usedIds = new Set();
			compilation.hooks.beforeModuleIds.tap(
				"HashedModuleIdsPlugin",
				modules => {
					const chunkGraph = compilation.chunkGraph;
					const modulesInNaturalOrder = Array.from(modules)
						.filter(m => chunkGraph.getNumberOfModuleChunks(m) > 0)
						.sort(compareModulesByIndexOrIdentifier(compilation.moduleGraph));
					for (const module of modulesInNaturalOrder) {
						if (chunkGraph.getModuleId(module) === null) {
							const id = module.libIdent({
								context: this.options.context || compiler.options.context
							});
							if (id) {
								const hash = createHash(options.hashFunction);
								hash.update(id);
								const hashId = hash.digest(options.hashDigest);
								let len = options.hashDigestLength;
								while (usedIds.has(hashId.substr(0, len))) len++;
								const moduleId = hashId.substr(0, len);
								chunkGraph.setModuleId(module, moduleId);
								usedIds.add(moduleId);
							}
						}
					}
				}
			);
		});
	}
}

module.exports = HashedModuleIdsPlugin;