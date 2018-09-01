import {concatMap, exhaustMap, filter, map, mergeMap, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {animationFrameScheduler, interval, merge, Observable, Subject} from 'rxjs';
import {Component, Vue} from 'vue-property-decorator';
import Ball from '../ball/ball.vue';
import {OperationType} from '../operation.enum';

export interface AnimationParameters {
  element: Vue,
  value: number
}

export type AnimationFunction = (source: Vue) => Observable<AnimationParameters>;

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

    const animation: AnimationFunction = this.animateValues(height, 200);

    const switchPipe = this.throwBall$.pipe(this.createAndAnimate(OperationType.SWITCH_MAP, animation));
    const mergePipe = this.throwBall$.pipe(this.createAndAnimate(OperationType.MERGE_MAP, animation));
    const concatPipe = this.throwBall$.pipe(this.createAndAnimate(OperationType.CONCAT_MAP, animation));
    const exhaustPipe = this.throwBall$.pipe(this.createAndAnimate(OperationType.EXHAUST_MAP, animation));

    const allPipes$ = merge(switchPipe, mergePipe, concatPipe, exhaustPipe);

    allPipes$.subscribe((parameters: AnimationParameters) => {
      console.log(parameters);
      parameters.element.$el.style.top = `${parameters.value}px`;
    });
  }

  public clear() {
    const el: Element = <Element>this.$refs.container;
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  public handleClick(operation: OperationType) {
    this.throwBall$.next(operation);
  }

  private createBall(operation: OperationType): Vue {
    const color = this.getBallColor(operation);
    const BallComponent = Vue.extend(Ball);
    const left = Math.random() * (this.containerWidth - 50);
    return new BallComponent({propsData: {left, color}});
  }

  private animateValues =
    (containerHeight: number, animationSteps: number): AnimationFunction =>
      (element: Vue): Observable<AnimationParameters> => {
        return interval(0, animationFrameScheduler).pipe(
          take(animationSteps),
          map((value: number) => value * ((containerHeight - 50) / animationSteps)),
          map((value: number) => ({element, value}))
        );
      };

  private addToContainer(element: Vue) {
    element.$mount();
    const el: Element = <Element>this.$refs.container;
    el.appendChild(element.$el);
  }

  private createAndAnimate(operation: OperationType, animation$: AnimationFunction) {
    return (source$: Observable<number>) => source$.pipe(
      filter((pipeOperation) => operation === pipeOperation),
      map(() => this.createBall(operation)),
      tap((component) => this.addToContainer(component)),
      this.mapToOperator(operation, animation$),
      takeUntil(this.destroy$)
    );
  }

  private mapToOperator(operator: OperationType, innerObservable$: AnimationFunction) {
    return (source$: Observable<Vue>) => {
      switch (operator) {
        case OperationType.SWITCH_MAP: {
          return source$.pipe(switchMap(innerObservable$));
        }
        case OperationType.MERGE_MAP: {
          return source$.pipe(mergeMap(innerObservable$));
        }
        case OperationType.CONCAT_MAP: {
          return source$.pipe(concatMap(innerObservable$));
        }
        case OperationType.EXHAUST_MAP: {
          return source$.pipe(exhaustMap(innerObservable$));
        }
        default:
          return source$.pipe(switchMap(innerObservable$));
      }
    }
  }

  private getBallColor(operator: OperationType): string {
    switch (operator) {
      case OperationType.SWITCH_MAP: {
        return 'red';
      }
      case OperationType.MERGE_MAP: {
        return 'green';
      }
      case OperationType.CONCAT_MAP: {
        return 'blue';
      }
      case OperationType.EXHAUST_MAP: {
        return 'yellow';
      }
      default:
        return 'black';
    }
  }
}
