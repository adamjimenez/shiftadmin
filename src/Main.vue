<template>
	<v-app :class="mobile ? 'mobile' : 'desktop'">
		<v-app-bar color="secondary">
			<v-app-bar-nav-icon v-if="!mobile || !showSearch" variant="text" color="grey-lighten-1"
				@click.stop="if (mobile) { drawer = !drawer; } else { rail = !rail }"></v-app-bar-nav-icon>

			<v-btn v-if="!mobile" :to=base variant="plain">
				{{ vars?.branding?.title ? vars.branding.title : 'Admin' }}
			</v-btn>

			<div class="text-align-center w-100 d-flex flex-row justify-center align-center" if="showSearch">

				<div v-if="mobile && selected.length && $refs.childComponent.selected?.length" class="flex-grow-1">
					<v-btn variant="text" @click="selectNone">
						<v-icon icon="mdi-arrow-left" />
					</v-btn>
					{{ selected.length }}
				</div>

				<v-combobox v-else-if="section && fields.length" v-model="search" :items="searchItems"
					@update:search="updateSearch" @update:model-value="afterSelection" @keydown.enter="quickSearch"
					ref="autocomplete" hide-details hide-no-data single-line rounded variant="solo-filled" no-filter
					class="mx-1" style="max-width: 800px;" :label="'Search ' + section"
					:placeholder="'Search ' + section" @focus="onSearchFocus">
					<template v-slot:prepend-inner>
						<v-icon icon="mdi:mdi-arrow-left" v-if="searchFocussed" @click.stop="searchFocussed = false"
							@mousedown.stop></v-icon>
						<v-app-bar-nav-icon v-else-if="mobile" color="grey-lighten-1"
							@click.stop="if (mobile) { drawer = !drawer; } else { rail = !rail }"
							@mousedown.stop></v-app-bar-nav-icon>
						<v-icon v-else icon="mdi:mdi-magnify"></v-icon>
					</template>
					<template v-slot:append-inner>
						<AccountButton :user="user" v-if="mobile && !searchFocussed"></AccountButton>
						<v-btn v-else color="grey-lighten-1" @mousedown.stop @click.stop="advancedSearch"
							:disabled="fields.length === 0" icon>
							<v-badge :content="searchParamCount" color="info" v-if="searchParamCount > 0">
								<v-icon icon="mdi-tune" />
							</v-badge>
							<v-icon icon="mdi-tune" v-else />
						</v-btn>
					</template>
					<template v-slot:item="{ item, props }">
						<v-list-item v-bind="props" @mousedown.stop="goToRecord(item.value)"></v-list-item>
					</template>
				</v-combobox>
			</div>

			<v-spacer v-if="!mobile || !showSearch"></v-spacer>

			<AccountButton :user="user" v-if="!mobile || !showSearch"></AccountButton>
		</v-app-bar>

		<v-navigation-drawer v-model="drawer" :rail="rail" expand-on-hover :permanent="!mobile" color="secondary">
			<v-list>
				<v-list-item v-if="mobile" :to=base prepend-icon="mdi-home">
					{{ vars?.branding?.title ? vars.branding.title : 'Admin' }}
				</v-list-item>

				<v-list-item :title="'Upgrade'" prepend-icon="mdi-rocket-launch" :to="base + 'upgrade'" base-color="red"
					v-if="edition !== 'Business'" />

				<div v-for="item in vars?.menu" :key="item">
					<v-list-group v-if="item.children" :prepend-icon="item.icon ? item.icon : 'mdi-minus'"
						:value="item.title">
						<template v-slot:activator="{ props }">
							<v-list-item v-bind="props" :title="item.title" />
						</template>

						<v-list-item v-for="child in item.children" :key="child.to" :title="child.title"
							:value="child.to" :to="child.target_blank ? child.to : base + child.to"
							:target="child.target_blank ? '_blank' : ''">
							<template v-slot:prepend>
								<v-badge :content="parseInt(child?.count).toLocaleString()" color="error"
									v-if="child?.count > 0">
									<v-icon :icon="child.icon ? child.icon : 'mdi-minus'" />
								</v-badge>
								<v-icon :icon="child.icon ? child.icon : 'mdi-minus'" v-else />
							</template>
							<template v-slot:append>
								<v-btn icon="mdi-delete" v-if="child.filter_id"
									@click.stop="deleteFilter(child.filter_id)" variant="text" size="x-small" />
							</template>
						</v-list-item>
					</v-list-group>

					<v-list-item v-else :title="item.title" :value="item.to"
						:to="item.target_blank ? item.to : base + item.to" :target="item.target_blank ? '_blank' : ''">
						<template v-slot:prepend>
							<v-badge :content="parseInt(child?.count).toLocaleString()" color="error"
								v-if="item?.count > 0">
								<v-icon :icon="item.icon ? item.icon : 'mdi-minus'" />
							</v-badge>
							<v-icon :icon="item.icon ? item.icon : 'mdi-minus'" v-else />
						</template>
					</v-list-item>
				</div>

				<v-list-group prepend-icon="mdi-chart-line" value="Reports">
					<template v-slot:activator="{ props }">
						<v-list-item v-bind="props" title="Reports" />
					</template>

					<v-list-item title="New" prepend-icon="mdi-plus" :to="base + 'reports/0'" />
					<v-list-item v-for="child in vars?.reports" :key="child.to" :title="child.title"
						prepend-icon="mdi-minus" @click="openReport(child.id)">
						<template v-slot:append>
							<v-btn icon="mdi-delete" v-if="child.id" @click.stop="deleteReport(child.id)" variant="text"
								size="x-small" />
						</template>
					</v-list-item>
				</v-list-group>

				<FileUploads ref="fileUploads" @fileSelected="fileSelectedHandler"
					v-if="user?.admin === 1 || user?.privileges?.uploads > 0" />
				<v-list-item title="Configure" prepend-icon="mdi-cog" :to="base + 'configure'"
					v-if="user?.admin === 1" />
			</v-list>
		</v-navigation-drawer>

		<v-main class="d-flex flex-column align-center justify-center">
			<router-view 
				ref="main"
				class="w-100 flex-grow-1"
				:vars="vars"
				:searchparams="searchParams"
				:class="fullScreen ? 'fullScreen' : ''"
				:mobile="mobile"
				:fileSelected="fileSelected"
				@changeFields="changeFields"
				@changeHeaders="changeHeaders"
				@chooseFileUpload="chooseFileUpload"
				@message="message"
				@configUpdated="fetchData"
				@updateCount="updateCount"
				@changeSelected="changeSelected"
				v-slot="{ Component }"
			>
				<component :is="Component" ref="childComponent" />
			</router-view>
		</v-main>

		<v-dialog v-model="advancedDialog" max-width="600" scrollable>
			<v-card>
				<v-card-title>Search {{ section }}</v-card-title>
				<v-divider></v-divider>
				<v-card-text>
					<template v-for="field in fields" :key="field.type">
						<v-list-item v-if="searchable.includes(field.type)">
							<search-field :column="field.column" :type="field.type" :optionConfig="vars.options"
								:label="formatString(field.column)" v-model="params[field.column]"
								:func="params?.func?.[field.column]" @updateFunc="updateFunc"></search-field>
						</v-list-item>
					</template>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn @click="saveSearch" color="primary" variant="tonal">Create filter</v-btn>
					<v-btn @click="doSearch" color="primary" variant="flat">Search</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-app>
</template>

<script setup>
// react to dark mode change from device
import { useTheme } from 'vuetify'

const theme = useTheme();

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
	const newColorScheme = event.matches ? "dark" : "light";
	theme.global.name.value = newColorScheme;
});
</script>

<script>
import api from "./services/api";
import util from "./services/util";
import qs from "qs";
import FileUploads from "./components/FileUploads";
import SearchField from "./components/SearchField";
import { useDisplay } from 'vuetify';
import AccountButton from './components/AccountButton.vue';

export default {
	name: 'GenieAdmin',

	components: {
		FileUploads,
		SearchField,
		AccountButton
	},

	data: function () {
		return {
			section: '',
			search: null,
			searchItems: [],
			drawer: true,
			rail: true,
			vars: {},
			data: {},
			user: {},
			advancedDialog: false,
			fields: [], // fields which are shown
			headers: [], // all columns
			params: { func: {} },
			searchParams: {},
			searchable: [
				'checkbox',
				'combo',
				'date',
				'datetime',
				'decimal',
				'deleted',
				'email',
				'id',
				'int',
				'page_name',
				'rating',
				'select',
				'select_parent',
				'select_multiple',
				'tel',
				'text',
				'timestamp',
			],
			fileSelected: {},
			fullScreen: false,
			display: {},
			searchFocussed: false,
			ignoreChange: false,
			child: {},
			selected: 0
		};
	},

	methods: {
		afterSelection: function (item) {
			if (typeof item !== 'object' || item === null) {
				return;
			}

			this.goToRecord(item.value);
		},
		goToRecord(id) {
			this.$router.push(this.base + 'section/' + this.section + '/' + id + '/');
		},
		updateSearch: async function () {
			if (this.search !== null && typeof this.search === 'object') {
				return;
			}

			let data = {
				cmd: 'get',
				section: this.$route.params.section,
				fields: { s: this.search },
				itemsPerPage: 10,
				columns: this.fields.map(item => item.column)
			};

			const params = qs.stringify(data);

			this.loading = true;
			this.error = '';

			let result = {};
			try {
				result = await api.get('?' + params.toString(), data);
			} catch (error) {
				console.log(error)
			}

			if (result.data.error) {
				this.error = result.data.error;
			}

			this.loading = false;

			// update search combo
			let searchItems = [];

			result.data.data.forEach(item => {
				let title = '';
				for (const [k, v] of Object.entries(item)) {
					let field = this.fields.find(field => field.column === k);
					if (!v || !['text'].includes(field?.type)) {
						continue;
					}

					if (title) {
						title += ', ';
					}

					title += v;
				}

				searchItems.push({
					value: item.id,
					title: title
				});
			});

			this.searchItems = searchItems;
		},
		updateFunc: function (column, func) {
			this.params.func[column] = func;
		},
		quickSearch: function () {
			this.searchParams = { s: this.search };
		},
		doSearch: function () {
			let searchParams = {};

			for (const [k, v] of Object.entries(this.params)) {
				if (['parentsection', 'parentid'].includes(k) || typeof v === 'undefined') {
					continue;
				}

				searchParams[k] = v;
			}

			console.log('do search update params')
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
		changeHeaders: function (headers) {
			this.headers = headers;
		},
		fetchData: async function () {
			let result = {};
			try {
				result = await api.get('?cmd=config');
			} catch (error) {
				console.log(error)
			}

			let data = result.data;

			// backcompat subsections
			if (data?.vars && data.vars.subsections) {
				for (let [section, subsections] of Object.entries(data.vars.subsections)) {
					subsections.forEach((subsection, index) => {
						if (typeof subsection === 'string') {
							data.vars.subsections[section][index] = {
								title: this.formatString(subsection),
								subsection: subsection,
							};
						}
					});
				}
			}

			this.vars = data?.vars;
			this.user = data?.user;

			let colors = {
				primary: '#007bff',
				secondary: '#303641',
			};

			this.$vuetify.theme.themes.light.colors = { ...this.$vuetify.theme.themes.light.colors, ...colors, ...this.vars?.branding?.colors };
			this.$vuetify.theme.themes.dark.colors = { ...this.$vuetify.theme.themes.dark.colors, ...colors, ...this.vars?.branding?.colors };

			let title = this.vars?.branding?.title ? this.vars.branding.title : 'ADMIN';

			if (!document.title) {
				document.title = title;
			}
		},
		deleteFilter: async function (filter_id) {
			if (!confirm('Are you sure?')) {
				return;
			}

			await api.post('?cmd=filters', { delete: filter_id });
			this.fetchData();
		},
		openReport: function (id) {
			this.$router.push(this.base + 'reports/' + id);
		},
		deleteReport: async function (id) {
			if (!confirm('Are you sure?')) {
				return;
			}

			await api.post('?cmd=reports', { delete: id });
			this.fetchData();

			if (this.$route.fullPath === this.base + 'reports/' + id) {
				this.$router.push(this.base);
			}
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
		},
		updateCount: function (data) {
			this.vars?.menu?.forEach(menu => {
				menu.children?.forEach(child => {
					if (location.href.endsWith(child.to)) {
						child.count = data.total;
					}
				})
			})
		},
		changeSelected: function (data) {
			this.selected = data;
		},
		onSearchFocus: function () {
			if (this.mobile) {
				this.searchFocussed = true;
			}
		},
		selectNone: function () {
			this.$refs['childComponent'].selectNone();
		}
	},

	watch: {
		$route: async function () {
			if (util.getEdition() === 'Unlicensed') {
				this.$router.push(util.base() + 'upgrade');
				return;
			}

			// get params from qs
			let query = this.$route.query
			if (query) {
				this.params = query;

				this.ignoreChange = true;
				this.searchParams = query;
				await this.$nextTick();
				this.ignoreChange = false;
			}

			if (this.$route.params.section !== this.section) {
				this.section = this.$route.params.section;
				this.search = this.params.s;
				this.headers = [];
			}
		},
		searchParams: async function (searchParams) {
			if (this.ignoreChange || !this.$route.params.section) {
				return;
			}

			let params = {};

			for (const [k, v] of Object.entries(searchParams)) {
				if (['parentsection', 'parentid'].includes(k) || typeof v === 'undefined') {
					continue;
				}

				params[k] = v;
			}

			if (Object.values(params).length) {
				// added force as there seems to be a bug with vue-router not redirecting
				await this.$router.push({ path: this.base + 'section/' + this.$route.params.section, query: params, force: true });
			}
		},
		mobile(mobile) {
			this.rail = !mobile;
			this.drawer = !mobile;
		},
		rail(newVal) {
			localStorage.rail = newVal;
		},
		advancedDialog(newVal) {
			if (newVal === false) {
				this.searchFocussed = false;
			}
		}
	},

	computed: {
		base() {
			return util.base();
		},
		searchParamCount() {
			return Object.keys(this.searchParams).filter(item => !['func', 's'].includes(item) && typeof this.searchParams[item] !== 'undefined').length
		},
		edition() {
			return util.getEdition();
		},
		mobile: function () {
			return this.display;
		},
		showSearch: function () {
			return this.headers.find(item => item.type === 'id') || false
		}
	},

	async mounted() {
		const { mobile } = useDisplay();
		this.display = mobile;

		await this.$router.isReady()

		// get params from qs
		let query = this.$route.query
		if (query) {
			this.params = query;
			this.searchParams = query;
			this.search = this.params.s;
		}

		if (this.$route.params.section) {
			this.section = this.$route.params.section;
		}

		await this.fetchData();

		if (localStorage.rail === 'false') {
			this.rail = false;
		}
	}
}
</script>

<style>
.v-application--wrap {
	min-height: 100% !important;
}

.desktop .v-navigation-drawer__content {
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