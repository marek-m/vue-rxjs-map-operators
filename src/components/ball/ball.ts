import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Ball extends Vue {
  @Prop() public left!: number;
  @Prop() public color!: string;
}
