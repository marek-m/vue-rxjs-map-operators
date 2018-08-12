import { concatMap, exhaustMap, filter, map, mergeMap, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { interval, merge, Observable, Subject } from 'rxjs';
import { Component, Vue } from 'vue-property-decorator';
import Ball from '../ball/ball.vue';
import { OperationType } from '../operation.enum';

export interface AnimationParameters {
  element: Vue,
  value: number
}

@Component
export default class OperationsContainer extends Vue {
  public throwBall$: Subject<number> = new Subject();
  public destroy$: Subject<number> = new Subject();
  public containerWidth: number = 0;
  public containerHeight: number = 0;

  public calculateContainerSize() {
    const container: Element = <Element>this.$refs.container;
    this.containerHeight = container.clientHeight;
    this.containerWidth = container.clientWidth;
  }

  public mounted() {
    this.calculateContainerSize();
    this.createOperatorsAndSubscribe(this.containerWidth, this.containerHeight);
  }

  public beforeDestroy() {
    this.destroy$.next();
  }

  public createOperatorsAndSubscribe(width: number, height: number) {

    const animation = this.animationValues(height, 40);

    const switchOperation = this.throwBall$.pipe(
      filter(operation => operation === OperationType.SWITCH_MAP),
      map(() => this.createBall('red')),
      tap(ball => this.addToContainer(ball)),
      switchMap(animation),
    );

    const mergeOperation = this.throwBall$.pipe(
      filter(operation => operation === OperationType.MERGE_MAP),
      map(() => this.createBall('green')),
      tap(ball => this.addToContainer(ball)),
      mergeMap(animation),
    );

    const concatOperation = this.throwBall$.pipe(
      filter(operation => operation === OperationType.CONCAT_MAP),
      map(() => this.createBall('blue')),
      tap(ball => this.addToContainer(ball)),
      concatMap(animation),
    );

    const exhaustOperation = this.throwBall$.pipe(
      filter(operation => operation === OperationType.EXHAUST_MAP),
      map(() => this.createBall('yellow')),
      tap(ball => this.addToContainer(ball)),
      exhaustMap(animation),
    );

    const allOperations$ = merge(switchOperation, mergeOperation, concatOperation, exhaustOperation);

    allOperations$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((parameters: AnimationParameters) => {
      console.log(parameters);
      parameters.element.$el.style.top = `${parameters.value}px`;
    });
  }

  public animationValues = (containerHeight: number, animationSteps: number) => (element: Vue): Observable<AnimationParameters> => {
    return interval(80).pipe(
      take(animationSteps),
      map((value: number) => value * ((containerHeight - 50) / animationSteps)),
      map((value: number) => ({element, value}))
    );
  };

  public clear() {
    const el: Element = <Element>this.$refs.container;
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  public handleClick(operation: OperationType) {
    this.throwBall$.next(operation);
  }

  public createBall(color: string): Vue {
    const BallComponent = Vue.extend(Ball);
    const left = Math.random() * (this.containerWidth - 50);
    return new BallComponent({propsData: {left, color}});
  }

  private addToContainer(element: Vue) {
    element.$mount();
    const el: Element = <Element>this.$refs.container;
    el.appendChild(element.$el);
  }
}
