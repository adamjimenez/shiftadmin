<template>
	<v-app>
		<v-app-bar color="secondary">
			<v-app-bar-nav-icon variant="text" color="grey-lighten-1" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

			<div class="text-align-center w-100 d-flex flex-row justify-center">
				<v-combobox v-if="fields.length" v-model="search" :items="searchItems" @update:search="updateSearch"
					@update:model-value="afterSelection" @keydown.enter="quickSearch" label="Search" placeholder="Search"
					ref="autocomplete" hide-details hide-no-data prepend-inner-icon="mdi:mdi-magnify" single-line rounded
					variant="solo-filled" no-filter class="mx-5" style="max-width: 800px;">
					<template v-slot:prepend>
						<v-btn :to=base variant="plain">
							{{ vars?.branding?.title ? vars.branding.title : 'Admin' }}
						</v-btn>
					</template>
					<template v-slot:append-inner>
						<v-btn color="grey-lighten-1" @mousedown.stop @click="advancedSearch"
							:disabled="fields.length === 0" icon>
							<v-badge :content="searchParamCount" color="info" v-if="searchParamCount > 0">
								<v-icon icon="mdi-tune" />
							</v-badge>
							<v-icon icon="mdi-tune" v-else />
						</v-btn>
					</template>
				</v-combobox>
			</div>
		</v-app-bar>

		<v-navigation-drawer :rail="drawer" expand-on-hover permanent color="secondary">
			<v-list>
				<div v-for="item in vars?.menu" :key="item">
					<v-list-group v-if="item.children" :prepend-icon="item.icon ? item.icon : 'mdi-minus'"
						:value="item.title">
						<template v-slot:activator="{ props }">
							<v-list-item v-bind="props" :title="item.title" />
						</template>

						<v-list-item v-for="child in item.children" :key="child.to" :title="child.title" :value="child.to"
							:to="base + child.to">

							<template v-slot:prepend>
								<v-badge :content="child.count" color="error" v-if="child.count > 0">
									<v-icon :icon="child.icon ? child.icon : 'mdi-minus'" />
								</v-badge>
								<v-icon :icon="child.icon ? child.icon : 'mdi-minus'" v-else />
							</template>
							<template v-slot:append>
								<v-btn icon="mdi-delete" v-if="child.filter_id" @click.stop="deleteFilter(child.filter_id)"
									variant="text" size="x-small" />
							</template>
						</v-list-item>
					</v-list-group>

					<v-list-item v-else :title="item.title" :value="item.to" :to="base + item.to">
						<template v-slot:prepend>
							<v-badge :content="item.count" color="error" v-if="item.count > 0">
								<v-icon :icon="item.icon ? item.icon : 'mdi-minus'" />
							</v-badge>
							<v-icon :icon="item.icon ? item.icon : 'mdi-minus'" v-else />
						</template>
					</v-list-item>
				</div>

				<FileUploads ref="fileUploads" @fileSelected="fileSelectedHandler" />
				<v-list-item title="Configure" prepend-icon="mdi-cog" :to="base + 'configure'" />
				<v-list-item title="Logout" href="/logout" prepend-icon="mdi-logout" />
			</v-list>
		</v-navigation-drawer>

		<v-main class="d-flex flex-column align-center justify-center">
			<router-view ref="main" class="w-100 flex-grow-1" :vars="vars" :searchparams="searchParams"
				@changeFields="changeFields" @chooseFileUpload="chooseFileUpload" :fileSelected="fileSelected"
				@message="message" :class="fullScreen ? 'fullScreen' : ''" @saveConfig="fetchData" />
		</v-main>

		<v-dialog v-model="advancedDialog" max-width="600" scrollable>
			<v-card>
				<v-card-title>Search {{ section }}</v-card-title>
				<v-divider></v-divider>
				<v-card-text>
					<template v-for="field in fields" :key="field.type">
						<v-list-item v-if="searchable.includes(field.type)">
							<SearchField :column="field.column" :type="field.type" :optionConfig="vars.options" :label="formatString(field.column)"
								v-model="params[field.column]" :func="params?.func[field.column]"
								@updateFunc="updateFunc"
								></SearchField>
						</v-list-item>
					</template>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn @click="saveSearch" color="secondary">Create filter</v-btn>
					<v-btn @click="doSearch" color="primary" variant="flat">Search</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-app>
</template>

<script>
import api from "./services/api";
import util from "./services/util";
import FileUploads from "./components/FileUploads";
import SearchField from "./components/SearchField";

export default {
	name: 'ShiftAdmin',

	components: {
		FileUploads,
		SearchField
	},

	data: function () {
		return {
			section: '',
			search: '',
			searchItems: [],
			drawer: true,
			vars: {},
			data: {},
			advancedDialog: false,
			fields: [],
			params: { func: {} },
			searchParams: {},
			searchable: [
				'checkbox',
				'combo',
				'date',
				'datetime',
				'decimal',
				'deleted',
				'id',
				'int',
				'page_name',
				'rating',
				'select',
				'select_parent',
				'select_multiple',
				'text',
				'timestamp',
			],
			fileSelected: {},
			fullScreen: false,
		};
	},

	methods: {
		afterSelection: function (item) {
			if (typeof item !== 'object' || item === null) {
				return;
			}

			this.$router.push(this.base + 'section/' + this.section + '/' + item.value + '/');
		},
		updateSearch: async function (term) {
			if (typeof this.search === 'object') {
				return;
			}

			this.section = this.$route.params.section;

			const result = await api.post('?cmd=search&section=' + this.section, {
				term: term
			});

			this.searchItems = result.data.data;
			this.searchParams = { s: this.search };
		},
		updateFunc: function (column, func) {
			this.params.func[column] = func;
		},
		quickSearch: function () {
			this.searchParams = { s: this.search };
		},
		doSearch: function () {
			let searchParams = structuredClone(this.params);

			// remove empty
			for (const [k, v] of Object.entries(searchParams)) {
				if (v === '') {
					delete searchParams[k];
				}
			}

			for (const [k, v] of Object.entries(searchParams.func)) {
				if (v === '' || typeof searchParams[k] === 'undefined') {
					delete searchParams.func[k];
				}
			}

			this.searchParams = searchParams;
			this.advancedDialog = false;
		},
		saveSearch: async function () {
			let label = prompt('Name this filter');

			if (!label) {
				return;
			}

			let data = {
				save: 1,
				label: label,
				section: this.section,
				conditions: this.searchParams
			};

			await api.post('?cmd=filters', data);
			this.advancedDialog = false;

			this.fetchData();
		},
		advancedSearch: async function () {
			if (!this.params.func) {
				this.params.func = {};
			}

			this.advancedDialog = true;
		},
		changeFields: function (fields) {
			this.fields = fields;
		},
		fetchData: async function () {
			let result = {};
			try {
				result = await api.get('?cmd=config');
			} catch (error) {
				console.log(error)
			}

			this.vars = result.data?.vars;

			let colors = {
				primary: '#007bff',
				secondary: '#303641',
			};

			this.$vuetify.theme.themes.light.colors = { ...this.$vuetify.theme.themes.light.colors, ...colors, ...this.vars?.branding?.colors };
			this.$vuetify.theme.themes.dark.colors = { ...this.$vuetify.theme.themes.dark.colors, ...colors, ...this.vars?.branding?.colors };

			let title = this.vars?.branding?.title ? this.vars.branding.title : 'ADMIN';
			document.title = title;
		},
		deleteFilter: async function (filter_id) {
			if (!confirm('Are you sure?')) {
				return;
			}

			await api.post('?cmd=filters', { delete: filter_id });
			this.fetchData();
		},
		chooseFileUpload: function (column) {
			this.$refs['fileUploads'].open(column);
		},
		fileSelectedHandler: function (data) {
			this.fileSelected = data;
		},
		message: function (data) {
			console.log(data)

			if (typeof data.fullScreen === 'boolean') {
				this.fullScreen = data.fullScreen;
			}
		},
		formatString: function (string) {
			return util.formatString(string);
		}
	},

	watch: {
		$route() {
			// get params from qs
			let query = this.$route.query
			if (query) {
				this.params = query;
				this.searchParams = query;
			}

			if (this.$route.params.section) {
				this.section = this.$route.params.section;
			}
		},
		searchParams: function (searchParams) {
			let params = searchParams;
			delete params.parentsection;
			delete params.parentid;

			if (Object.values(searchParams).length) {
				this.$router.push({ path: this.base + 'section/' + this.$route.params.section, query: searchParams })
			}
		},
	},

	computed: {
		base() {
			return util.base();
		},
		searchParamCount() {
			return Object.keys(this.searchParams).filter(item => item !== 'func' && typeof this.searchParams[item] !== 'undefined').length
		}
	},

	async mounted() {
		await this.$router.isReady()

		// get params from qs
		let query = this.$route.query
		if (query) {
			this.params = query;
			this.searchParams = query;
		}

		if (this.$route.params.section) {
			this.section = this.$route.params.section;
		}

		await this.fetchData();
	}
}
</script>

<style>
.v-application--wrap {
	min-height: 100% !important;
}

.v-navigation-drawer__content {
	overflow-y: hidden;
}

.v-navigation-drawer__content:hover {
	overflow-y: auto !important;
}

.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) .v-list-group .v-list-item {
	padding-left: 16px !important;
}

::-webkit-scrollbar {
	width: 5px;
}

::-webkit-scrollbar-track {
	background: transparent;
}

::-webkit-scrollbar-thumb {
	background-color: rgba(155, 155, 155, 0.5);
	border: transparent;
}

.fullScreen {
	position: static !important;
}

.fullScreen iframe {
	position: absolute;
	background: #fff;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	height: 100%;
	width: 100%;
	z-index: 99999999;
}

html {
	overflow-y: auto;
}
</style>