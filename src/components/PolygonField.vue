<template>
    <div>
        <v-text-field v-bind="$attrs" @click="open" v-model="value"></v-text-field>

        <v-dialog v-model="dialog" scrollable eager persistent>
            <v-card>
                <v-card-title class="d-flex justify-space-between align-center">
                    <div class="text-h5 text-medium-emphasis ps-2">
                        Edit polygon
                    </div>

                    <v-btn icon="mdi-close" @click="dialog = false;"></v-btn>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                    <div style="height:600px;">
                        <l-map ref="map" v-model:zoom="zoom" :center="[51.8100844, -0.02911359999995966]"
                            @click="addMarker">
                            <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base"
                                name="OpenStreetMap"></l-tile-layer>
                            <l-polygon v-model:lat-lngs="polygon" color="#41b782" :fill="true" :fillOpacity="0.5"
                                fillColor="#41b782" v-if="polygonUpdated" />
                            <l-feature-group>
                                <l-marker v-for="point, index in polygon" v-model:lat-lng="polygon[index]" :key="index"
                                    draggable @click="clickMarker" />
                            </l-feature-group>
                        </l-map>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="secondary" variant="flat" @click="clear">Clear</v-btn>
                    <v-btn color="primary" variant="flat" @click="ok">OK</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { LMap, LPolygon, LTileLayer, LFeatureGroup, LMarker } from "@vue-leaflet/vue-leaflet";

export default {
    components: {
        LMap,
        LPolygon,
        LTileLayer,
        LFeatureGroup,
        LMarker,
    },
    props: {
        modelValue: {
            type: [String],
        },
    },
    name: "PolygonField",
    data: () => ({
        value: '',
        dialog: false,
        zoom: 11,
        polygon: [],
        coord: [51.8100844, -0.02911359999995966],
        polygonUpdated: true,
    }),
    methods: {
        open: async function () {
            let polygon = [];
            let coords = this.value.split(',');
            coords.forEach(coord => {
                let point = coord.split(' ');
                polygon.push(point);
            });

            this.polygon = polygon;

            this.dialog = true;
            const polygonBounds = L.polygon(this.polygon).getBounds();

            let map = this.$refs.map.leafletObject;

            await this.$nextTick();
            map.invalidateSize();
            map.fitBounds(polygonBounds);
        },
        ok: function () {
            let value = '';
            this.polygon.forEach(coord => {
                if (value) {
                    value += ',';
                }

                if (coord.lat) {
                    value += coord.lat + ' ' + coord.lng;
                } else {
                    value += coord[0] + ' ' + coord[1];
                }
            })

            this.value = value;
            this.$emit('update:modelValue', this.value);
            this.dialog = false;
        },
        clear: function () {
            this.polygon = [];
        },
        addMarker(event) {
            const { lat, lng } = event.latlng;
            this.polygon.push([lat, lng]);
        },
        clickMarker(event) {
            let found;
            this.polygon.forEach((coord, index) => {
                let lat = coord.lat ? coord.lat : coord[0];
                let lng = coord.lng ? coord.lng : coord[1];

                if (event.latlng.lat === lat || event.latlng.lng === lng) {
                    found = index;
                }
            });

            if (typeof found === 'number') {
                this.polygon.splice(found, 1);
            }
        },
    },
    watch: {
        polygon: {
            handler: async function () {
                // refresh polygon hack
                this.polygonUpdated = false;
                await this.$nextTick();
                this.polygonUpdated = true;
            },
            deep: true
        }
    },
    mounted: function () {
        this.value = this.modelValue;
    }
}
</script>