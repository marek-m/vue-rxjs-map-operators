<template>
    <div class="app">
        <div class="buttons">
            <button @click="handleClick(0)">SWITCH</button>
            <button @click="handleClick(1)">MERGE</button>
            <button @click="handleClick(2)">CONCAT</button>
            <button @click="handleClick(3)">EXHAUST</button>
            <button @click="clear()">CLEAR</button>
        </div>
        <div ref="container" class="container">
        </div>
    </div>
</template>
<script lang="ts" src="./operations-container.ts" />
<style scoped lang="scss" src="./operations-container.scss" />
