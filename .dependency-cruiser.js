/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
	forbidden: [
		{
			name: "domain-pureness",
			comment: "The domain layer must not depend on any outer layer.",
			severity: "error",
			from: { path: "^src/domain" },
			to: { path: "^src/(application|presentation|infrastructure)" },
		},
		{
			name: "application-pureness",
			comment:
				"The application layer must not depend on presentation or infrastructure.",
			severity: "error",
			from: { path: "^src/application" },
			to: { path: "^src/(presentation|infrastructure)" },
		},
	],
	options: {
		doNotFollow: {
			path: "node_modules",
		},
		tsConfig: {
			fileName: "tsconfig.json",
		},
		enhancedResolveOptions: {
			exportsFields: ["exports"],
			conditionNames: ["import", "require", "node", "default"],
		},
	},
};
