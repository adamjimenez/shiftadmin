<template>
	<router-view></router-view>
</template>

<style>
/* Disable text selection globally */
.data-table-server {
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE/Edge */
  user-select: none; /* Standard */
  -webkit-touch-callout: none; /* Disable iOS long-press callout */
}
</style>